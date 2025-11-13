import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSettings as useLocalSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import './Settings.css';

const Settings = () => {
  const { refreshSiteSettings, currency: contextCurrency, vat_rate: contextVatRate, ...restSettings } = useLocalSettings();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState({
    currency: contextCurrency || 'ILS',
    vat_rate: contextVatRate || 18
  });
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceTimerRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const previousSettingsRef = useRef({ currency: null, vat_rate: null });
  const isSavingRef = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/settings/currencies')
        ]);
        const fetchedSettings = Array.isArray(settingsRes.data) ? settingsRes.data[0] : settingsRes.data;
        const initialSettings = {
          currency: fetchedSettings.currency || 'ILS',
          vat_rate: fetchedSettings.vat_rate || 18
        };
        setSettings(initialSettings);
        previousSettingsRef.current = { ...initialSettings };
        setCurrencies(currenciesRes.data);
        hasInitializedRef.current = true;
      } catch (err) {
        showError('Error loading settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showError]);

  // Sync with context when it changes externally (but not during our own save)
  useEffect(() => {
    // Don't sync during initialization or while saving
    if (!hasInitializedRef.current || isSavingRef.current) return;
    
    const contextSettings = {
      currency: contextCurrency || 'ILS',
      vat_rate: contextVatRate || 18
    };
    
    // Only sync if context differs from previous settings (external change)
    // This prevents loops - if we just saved, previousSettingsRef already matches
    if (contextCurrency !== previousSettingsRef.current.currency || 
        contextVatRate !== previousSettingsRef.current.vat_rate) {
      // This is an external change, update our local state
      setSettings(contextSettings);
      previousSettingsRef.current = { ...contextSettings };
    }
  }, [contextCurrency, contextVatRate]);

  const saveSettings = useCallback(async (newSettings) => {
    // Prevent concurrent saves using ref
    if (isSavingRef.current) {
      return;
    }
    
    isSavingRef.current = true;
    setSaving(true);
    
    // Store the previous settings before updating
    const oldSettings = { ...previousSettingsRef.current };
    
    // Update previousSettingsRef immediately to prevent loop
    // This ensures when context updates, sync effect won't trigger another save
    previousSettingsRef.current = { ...newSettings };
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings', {
        currency: newSettings.currency,
        vat_rate: newSettings.vat_rate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update context immediately for instant UI updates
      // This will trigger sync effect, but previousSettingsRef already matches, so no loop
      await refreshSiteSettings();
      
      // Show success toast
      showSuccess('Settings saved');
      
    } catch (err) {
      // Revert previousSettingsRef on error
      previousSettingsRef.current = oldSettings;
      showError('Error updating settings');
      // Revert to previous settings on error
      setSettings(oldSettings);
    } finally {
      setSaving(false);
      // Reset isSavingRef after a delay to prevent rapid re-triggers
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
    }
  }, [refreshSiteSettings, showSuccess, showError]);

  // Debounced auto-save on settings change
  useEffect(() => {
    // Don't save on initial load
    if (!hasInitializedRef.current) return;
    
    // Don't save if settings haven't changed from previous
    if (settings.currency === previousSettingsRef.current.currency &&
        settings.vat_rate === previousSettingsRef.current.vat_rate) {
      return;
    }

    // Don't save if already saving
    if (isSavingRef.current) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced save
    debounceTimerRef.current = setTimeout(() => {
      // Double-check settings have actually changed and we're not saving
      if (!isSavingRef.current && 
          (settings.currency !== previousSettingsRef.current.currency ||
           settings.vat_rate !== previousSettingsRef.current.vat_rate)) {
        saveSettings(settings);
      }
    }, 300); // 300ms debounce

    // Cleanup on unmount or when settings change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.currency, settings.vat_rate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (name === 'vat_rate' ? parseFloat(value) || 0 : value);
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  if (loading) {
    return <div className="settings-container"><div>Loading settings...</div></div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your store settings and preferences</p>
        {saving && (
          <p className="settings-saving-indicator" style={{ color: '#667eea', fontSize: '0.9em', marginTop: '8px' }}>
            Saving...
          </p>
        )}
      </div>

      <div className="settings-form-section">
        <div className="form-group">
          <label>VAT Rate (%)</label>
          <input 
            type="number" 
            name="vat_rate" 
            value={settings.vat_rate || ''} 
            onChange={handleChange}
            step="0.1"
            min="0"
            max="100"
          />
          <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
            Changes are saved automatically
          </small>
        </div>
        
        <div className="form-group">
          <label>Store Currency</label>
          <select name="currency" value={settings.currency || 'ILS'} onChange={handleChange}>
            {Object.keys(currencies).map(code => (
              <option key={code} value={code}>{currencies[code].name} ({currencies[code].symbol})</option>
            ))}
          </select>
          <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
            Changes are saved automatically
          </small>
        </div>
      </div>
    </div>
  );
};

export default Settings;
