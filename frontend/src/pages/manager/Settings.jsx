import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings as useLocalSettings } from '../../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { refreshSiteSettings, ...initialSettings } = useLocalSettings();
  const [settings, setSettings] = useState(initialSettings);
  const [currencies, setCurrencies] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

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
        setMessage('Error loading settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { currency, vat_rate, site_name, contact_email, contact_phone, facebook_url, instagram_url, twitter_url } = settings;
      await axios.put('/api/settings', { currency, vat_rate, site_name, contact_email, contact_phone, facebook_url, instagram_url, twitter_url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings updated successfully');
      await refreshSiteSettings();
    } catch (err) {
      setMessage('Error updating settings');
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

  const TABS = ['general', 'currency', 'contact'];

  if (loading) {
    return <div className="settings-container"><div>Loading settings...</div></div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your store settings and preferences</p>
      </div>

      {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      <select className="settings-tab-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
        {TABS.map((tab) => (
          <option key={tab} value={tab}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </option>
        ))}
      </select>
      
      <form onSubmit={handleSubmit}>
        {activeTab === 'general' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Site Name</label>
              <input type="text" name="site_name" value={settings.site_name || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>VAT Rate (%)</label>
              <input type="number" name="vat_rate" value={settings.vat_rate || ''} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Store Currency</label>
              <select name="currency" value={settings.currency || 'ILS'} onChange={handleChange}>
                {Object.keys(currencies).map(code => (
                  <option key={code} value={code}>{currencies[code].name} ({currencies[code].symbol})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Contact Email</label>
              <input type="email" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input type="tel" name="contact_phone" value={settings.contact_phone || ''} onChange={handleChange} />
            </div>
          </div>
        )}
        
        <button type="submit" className="settings-save-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;