import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';

const Settings = () => {
  const { user_id, username, fetchStoreSettings } = useSettings();
  const [settings, setSettings] = useState({
    contactEmail: '',
    contactPhone: '',
    storeName: '',
    taxRate: 0,
    currency: 'ILS'
  });
  const [currencies, setCurrencies] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/currencies')
        ]);
        setSettings({
          contactEmail: settingsRes.data.contactEmail || '',
          contactPhone: settingsRes.data.contactPhone || '',
          storeName: settingsRes.data.storeName || '',
          taxRate: settingsRes.data.taxRate || 0,
          currency: settingsRes.data.currency || 'ILS'
        });
        setCurrencies(currenciesRes.data);
      } catch (err) {
        console.error('Error fetching settings:', err);
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
      const { contactEmail, contactPhone, taxRate, storeName, currency } = settings;
      await axios.put('http://localhost:3001/api/settings', {
        contactEmail,
        contactPhone,
        taxRate: Number(taxRate),
        storeName,
        currency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings updated successfully');
      if (fetchStoreSettings) fetchStoreSettings();
    } catch (err) {
      console.error('Error updating settings:', err);
      setMessage('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <div style={{ 
          background: '#fff',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '800px'
        }}>
          <div style={{ textAlign: 'center', color: '#666' }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{ 
        flex: 1,
        marginLeft: '220px', // Match sidebar width
        padding: '20px'
      }}>
        <div style={{ 
          background: '#fff',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '1.8em',
            marginBottom: '10px',
            color: '#333'
          }}>Settings</h1>
          <p style={{ 
            color: '#666',
            marginBottom: '30px',
            fontSize: '0.95em'
          }}>Manage your store settings and preferences</p>
          
          {message && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              borderRadius: '5px',
              backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
              color: message.includes('Error') ? '#721c24' : '#155724',
              border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
            }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              display: 'flex',
              borderBottom: '1px solid #dee2e6',
              marginBottom: '20px'
            }}>
              {['general', 'currency', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: 'none',
                    color: activeTab === tab ? '#007bff' : '#666',
                    borderBottom: activeTab === tab ? '2px solid #007bff' : 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.color = '#0056b3'}
                  onMouseOut={(e) => e.target.style.color = activeTab === tab ? '#007bff' : '#666'}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Store Name</label>
                  <input
                    type="text"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Currency</label>
                  <select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  >
                    {Object.entries(currencies).map(([code, currency]) => (
                      <option key={code} value={code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Tax Rate (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 30px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;