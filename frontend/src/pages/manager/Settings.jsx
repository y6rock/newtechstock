import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings as useLocalSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import './Settings.css';

const Settings = () => {
  const { refreshSiteSettings, ...initialSettings } = useLocalSettings();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [currencies, setCurrencies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/settings/currencies')
        ]);
        const fetchedSettings = Array.isArray(settingsRes.data) ? settingsRes.data[0] : settingsRes.data;
        setSettings(prev => ({...prev, ...fetchedSettings}));
        setCurrencies(currenciesRes.data);
      } catch (err) {
        showError('Error loading settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { currency, vat_rate } = settings;
      await axios.put('/api/settings', { currency, vat_rate }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Settings updated successfully');
      await refreshSiteSettings();
    } catch (err) {
      showError('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      </div>

      
      <form onSubmit={handleSubmit}>
        <div className="settings-form-section">
          <div className="form-group">
            <label>VAT Rate (%)</label>
            <input type="number" name="vat_rate" value={settings.vat_rate || ''} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label>Store Currency</label>
            <select name="currency" value={settings.currency || 'ILS'} onChange={handleChange}>
              {Object.keys(currencies).map(code => (
                <option key={code} value={code}>{currencies[code].name} ({currencies[code].symbol})</option>
              ))}
            </select>
          </div>
        </div>
        
        <button type="submit" className="settings-save-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;