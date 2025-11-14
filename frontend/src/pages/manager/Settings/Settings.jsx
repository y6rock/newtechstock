import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSettings as useLocalSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import './Settings.css';

const Settings = () => {
  const { refreshSiteSettings, currency: contextCurrency, vat_rate: contextVatRate, ...restSettings } = useLocalSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const [settings, setSettings] = useState({
    currency: contextCurrency || 'ILS',
    vat_rate: contextVatRate || 18
  });
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Check if settings have changed from original
  const hasChanges = settings.currency !== previousSettingsRef.current.currency ||
                     settings.vat_rate !== previousSettingsRef.current.vat_rate;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (name === 'vat_rate' ? parseFloat(value) || 0 : value);
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSave = () => {
    // Show confirmation toast
    showConfirm(
      'Are you sure you want to save these settings?',
      () => {
        // User confirmed - save settings
        saveSettings(settings);
      },
      () => {
        // User cancelled - do nothing
      }
    );
  };

  if (loading) {
    return <div className="settings-container"><div>Loading settings...</div></div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your store settings and preferences</p>
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
        </div>
        
        <div className="form-group">
          <label>Store Currency</label>
          <select name="currency" value={settings.currency || 'ILS'} onChange={handleChange}>
            {Object.keys(currencies).map(code => (
              <option key={code} value={code}>{currencies[code].name} ({currencies[code].symbol})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <button
            className="settings-save-button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
