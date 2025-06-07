import React, { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [storeName, setStoreName] = useState('Loading...'); // Default loading state
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false); // Centralized admin status
  const [username, setUsername] = useState(null); // Centralized username

  const fetchStoreSettings = async () => {
    console.log('SettingsContext: fetchStoreSettings started');
    setLoadingSettings(true);
    setErrorSettings(null);
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('SettingsContext: No token found. Setting non-admin defaults.');
      setStoreName('TechStore'); // Fallback to a default name
      setIsUserAdmin(false); // No token, so not admin
      setUsername(null); // No token, so no username
      setLoadingSettings(false);
      console.log('SettingsContext: Finished fetch, isUserAdmin=', false, 'loadingSettings=', false);
      return;
    }

    try {
      // Decode the JWT token to get user role and username
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      console.log('SettingsContext: Decoded token payload:', payload);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.log('SettingsContext: Token expired. Removing it.');
        localStorage.removeItem('token');
        setIsUserAdmin(false);
        setUsername(null);
        setLoadingSettings(false);
        console.log('SettingsContext: Finished fetch, isUserAdmin=', false, 'loadingSettings=', false);
        return;
      }

      const adminStatus = payload.role === 'admin';
      const userDisplayName = payload.username || payload.name || payload.email || null;
      setIsUserAdmin(adminStatus);
      setUsername(userDisplayName);
      console.log('SettingsContext: isUserAdmin determined as:', adminStatus, 'Username:', userDisplayName);
      
      // Now fetch actual settings from API (only if still considered admin or if you want settings for all users)
      if (adminStatus) { // Only fetch settings if user is admin
        console.log('SettingsContext: Fetching /api/settings for admin...');
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error('SettingsContext: Failed to fetch store settings:', response.status, errorData);
          setErrorSettings(`Failed to load store settings: ${errorData.message}`);
          setStoreName('TechStore'); // Fallback on error
        }
        else {
          const data = await response.json();
          console.log('SettingsContext: /api/settings response data:', data);
          if (data && data.storeName) {
            setStoreName(data.storeName);
            setSettings(data);
          } else {
            setStoreName('TechStore'); // Fallback if no store name in settings
            setSettings({});
          }
        }
      } else { // Not admin, but maybe other users also have a default store name
        console.log('SettingsContext: Not admin, setting default store name.');
        setStoreName('TechStore'); // Default for non-admins
        setSettings({});
      }

    } catch (err) {
      console.error('SettingsContext: Error fetching store settings context or decoding token:', err);
      setErrorSettings(`Error: ${err.message}`);
      setStoreName('TechStore'); // Fallback on network/parsing error
      setIsUserAdmin(false);
      setUsername(null);
    } finally {
      setLoadingSettings(false);
      console.log('SettingsContext: Finished fetch (finally block), isUserAdmin=', isUserAdmin, 'loadingSettings=', false);
    }
  };

  useEffect(() => {
    fetchStoreSettings();
    // Listen for storage changes (e.g., token being set/removed on login/logout)
    window.addEventListener('storage', fetchStoreSettings);
    return () => {
      window.removeEventListener('storage', fetchStoreSettings);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Value provided by the context
  const contextValue = {
    storeName,
    settings,
    loadingSettings,
    errorSettings,
    isUserAdmin, // Provide admin status
    username, // Provide username
    fetchStoreSettings, // Allow components to re-fetch settings
    setStoreName, // Allow direct update (e.g., after save on settings page)
    setSettings,
    setIsUserAdmin, // Allow components (like Login/Logout) to update admin status directly
    setUsername // <--- ADDED THIS LINE
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 