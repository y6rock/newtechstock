import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { getExchangeRates, refreshExchangeRates } from '../utils/exchangeRate';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState({
    currency: 'ILS',
    vat_rate: 18,
  });
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [username, setUsername] = useState(null);
  const [user_id, setUserId] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const previousCurrencyRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const response = await axios.get('/api/settings');
      if (response.data && Object.keys(response.data).length > 0) {
        setSiteSettings(response.data);
      }
      // Fetch exchange rates after settings are loaded
      await getExchangeRates();
    } catch (error) {
      console.error("SettingsContext: Failed to fetch site settings.", error);
    }
  }, []);

  useEffect(() => {
    const checkTokenAndFetchSettings = async () => {
      setLoadingSettings(true);
      
      // Fetch site-wide settings first
      await fetchSiteSettings();

      // Then check user token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const currentTime = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > currentTime) {
            setIsUserAdmin(payload.role === 'admin');
            setUsername(payload.name || payload.username || 'User');
            setUserId(payload.user_id);
          } else {
            localStorage.removeItem('token');
            setIsUserAdmin(false);
            setUsername(null);
            setUserId(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setIsUserAdmin(false);
          setUsername(null);
          setUserId(null);
        }
      } else {
        setIsUserAdmin(false);
        setUsername(null);
        setUserId(null);
      }
      setLoadingSettings(false);
    };

    checkTokenAndFetchSettings();
  }, [fetchSiteSettings]);

  const reEvaluateToken = () => {
    window.location.reload(); 
  };
  
  const refreshSiteSettings = async () => {
    setLoadingSettings(true);
    await fetchSiteSettings();
    setLoadingSettings(false);
  };

  // Refresh exchange rates when currency changes (but not on initial load)
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousCurrencyRef.current = siteSettings.currency;
      return;
    }

    // Only refresh if currency actually changed and settings are loaded
    if (!loadingSettings && siteSettings.currency && previousCurrencyRef.current !== siteSettings.currency) {
      const refreshRatesOnCurrencyChange = async () => {
        // Force refresh exchange rates when currency changes
        console.log('Currency changed from', previousCurrencyRef.current, 'to', siteSettings.currency, '- Refreshing exchange rates');
        try {
          await refreshExchangeRates();
        } catch (error) {
          console.error('Error refreshing exchange rates:', error);
        }
      };

      refreshRatesOnCurrencyChange();
      previousCurrencyRef.current = siteSettings.currency;
    }
  }, [siteSettings.currency, loadingSettings]);

  const updateUsername = (newUsername) => {
    setUsername(newUsername);
  };

  const contextValue = {
    ...siteSettings,
    isUserAdmin,
    username,
    user_id,
    loadingSettings,
    reEvaluateToken,
    refreshSiteSettings,
    updateUsername,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 