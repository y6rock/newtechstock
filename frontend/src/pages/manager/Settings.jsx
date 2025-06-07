import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  // Context for global settings updates
  const { setStoreName: setGlobalStoreName, isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  // ALL useState declarations must be at the top level and unconditional
  const [storeName, setStoreName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // useEffect for redirection: This hook call is always at the top level.
  // The conditional logic is inside its callback.
  useEffect(() => {
    // Only redirect if settings have finished loading AND user is not admin
    if (!loadingSettings && !isUserAdmin) {
      navigate('/'); // Redirect to home if not admin
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  // useEffect for fetching settings: This hook call is also always at the top level.
  // The conditional logic (fetch only if admin) is inside its callback.
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in as admin.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch settings: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data) {
          setStoreName(data.storeName || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setTaxRate(data.taxRate != null ? data.taxRate.toString() : '');
          setEmailNotifications(data.emailNotifications != null ? data.emailNotifications : true);
          setGlobalStoreName(data.storeName || 'TechStore');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(`Error loading settings: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Only call fetchSettings if the user is an admin and settings are not loading
    if (isUserAdmin && !loadingSettings) {
        fetchSettings();
    }
  }, [isUserAdmin, loadingSettings, setGlobalStoreName]); // Added loadingSettings to dependencies

  // Render loading state while settings are being determined
  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Now, after all hooks are called unconditionally, we can conditionally return null.
  if (!isUserAdmin) {
    return null; 
  }

  // Handler for saving settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Cannot save settings.');
      return;
    }

    const settingsData = {
      storeName,
      contactEmail,
      contactPhone,
      taxRate: parseFloat(taxRate),
      emailNotifications,
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Failed to save settings: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Settings saved successfully:', result);
      setSaveSuccess(true);
      
      // Update global store name after successful save
      setGlobalStoreName(storeName);

    } catch (err) {
      console.error('Error saving settings:', err);
      setError(`Error saving settings: ${err.message}`);
    }
  };

  // Moved loading check after all hooks
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '20px', paddingLeft: '240px' }}>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px', paddingLeft: '240px' }}>
        <h2>Settings</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>Manage your store settings</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {saveSuccess && <p style={{ color: 'green' }}>Settings saved successfully!</p>}

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          border: '1px solid #eee', 
          borderRadius: '8px',
          maxWidth: '500px'
        }}>
          <h3 style={{ marginTop: '0' }}>Store Information</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Update your store details and contact information</p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Store Name:
            </label>
            <input 
              type="text" 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contact Email:
            </label>
            <input 
              type="email" 
              value={contactEmail} 
              onChange={(e) => setContactEmail(e.target.value)} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contact Phone:
            </label>
            <input 
              type="tel" 
              value={contactPhone} 
              onChange={(e) => setContactPhone(e.target.value)} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tax Rate (%):
            </label>
            <input 
              type="number" 
              step="0.1" 
              value={taxRate} 
              onChange={(e) => setTaxRate(e.target.value)} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

           <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold' }}>
              Email Notifications:
               <input 
                type="checkbox" 
                checked={emailNotifications} 
                onChange={(e) => setEmailNotifications(e.target.checked)} 
                style={{ marginLeft: '10px' }} 
              />
            </label>
          </div>

          <button 
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#343a40',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}