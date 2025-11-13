// Exchange rate utility - converts from ILS (base currency) to target currency
// Uses exchangerate-api.com free tier (no API key required for basic usage)

const EXCHANGE_RATE_CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const BASE_CURRENCY = 'ILS';

// Fallback exchange rates (updated periodically, used if API fails)
const FALLBACK_RATES = {
  USD: 0.27, // 1 ILS = 0.27 USD (approx 1 USD = 3.7 ILS)
  EUR: 0.25, // 1 ILS = 0.25 EUR (approx 1 EUR = 4.0 ILS)
  GBP: 0.21, // 1 ILS = 0.21 GBP (approx 1 GBP = 4.75 ILS)
  ILS: 1.0   // Base currency
};

/**
 * Fetch exchange rates from API
 */
const fetchExchangeRates = async () => {
  try {
    // Using exchangerate-api.com free endpoint (no API key needed)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/ILS');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    
    if (data && data.rates) {
      // Cache the rates with timestamp
      const cacheData = {
        rates: data.rates,
        timestamp: Date.now()
      };
      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cacheData));
      return data.rates;
    }
    
    throw new Error('Invalid exchange rate data');
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates if API fails
    return FALLBACK_RATES;
  }
};

/**
 * Get exchange rates (from cache or API)
 */
export const getExchangeRates = async () => {
  try {
    // Check cache first
    const cachedData = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const now = Date.now();
      
      // Use cached rates if less than 1 hour old
      if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
        return parsed.rates;
      }
    }
    
    // Fetch fresh rates
    return await fetchExchangeRates();
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return FALLBACK_RATES;
  }
};

/**
 * Get exchange rate for a specific currency
 * @param {string} targetCurrency - Target currency code (USD, EUR, GBP, ILS)
 * @returns {Promise<number>} Exchange rate (1 ILS = X targetCurrency)
 */
export const getExchangeRate = async (targetCurrency) => {
  if (targetCurrency === BASE_CURRENCY) {
    return 1.0;
  }
  
  const rates = await getExchangeRates();
  return rates[targetCurrency] || FALLBACK_RATES[targetCurrency] || 1.0;
};

/**
 * Convert price from ILS to target currency
 * @param {number} priceInILS - Price in Israeli Shekels
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<number>} Converted price
 */
export const convertFromILS = async (priceInILS, targetCurrency) => {
  if (!priceInILS || isNaN(parseFloat(priceInILS))) {
    return 0;
  }
  
  if (targetCurrency === BASE_CURRENCY) {
    return parseFloat(priceInILS);
  }
  
  const rate = await getExchangeRate(targetCurrency);
  return parseFloat(priceInILS) * rate;
};

/**
 * Invalidate exchange rate cache (force refresh on next request)
 */
export const invalidateExchangeRateCache = () => {
  localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
  console.log('Exchange rate cache invalidated');
};

/**
 * Force refresh exchange rates (bypass cache)
 * @returns {Promise<object>} Fresh exchange rates
 */
export const refreshExchangeRates = async () => {
  invalidateExchangeRateCache();
  return await fetchExchangeRates();
};

/**
 * Synchronous version using cached rates (for immediate display)
 * @param {number} priceInILS - Price in Israeli Shekels
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Converted price (uses cache or fallback)
 */
export const convertFromILSSync = (priceInILS, targetCurrency) => {
  if (!priceInILS || isNaN(parseFloat(priceInILS))) {
    return 0;
  }
  
  if (targetCurrency === BASE_CURRENCY) {
    return parseFloat(priceInILS);
  }
  
  try {
    const cachedData = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed.rates && parsed.rates[targetCurrency]) {
        return parseFloat(priceInILS) * parsed.rates[targetCurrency];
      }
    }
  } catch (error) {
    console.error('Error reading cached exchange rates:', error);
  }
  
  // Fallback to default rates
  const fallbackRate = FALLBACK_RATES[targetCurrency] || 1.0;
  return parseFloat(priceInILS) * fallbackRate;
};

/**
 * Convert price from target currency back to ILS (reverse conversion)
 * @param {number} priceInCurrency - Price in target currency
 * @param {string} sourceCurrency - Source currency code
 * @returns {number} Price in ILS
 */
export const convertToILS = (priceInCurrency, sourceCurrency) => {
  if (!priceInCurrency || isNaN(parseFloat(priceInCurrency))) {
    return 0;
  }
  
  if (sourceCurrency === BASE_CURRENCY) {
    return parseFloat(priceInCurrency);
  }
  
  try {
    const cachedData = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed.rates && parsed.rates[sourceCurrency]) {
        // Reverse: divide by rate (if 1 ILS = 0.27 USD, then 1 USD = 1/0.27 ILS)
        return parseFloat(priceInCurrency) / parsed.rates[sourceCurrency];
      }
    }
  } catch (error) {
    console.error('Error reading cached exchange rates:', error);
  }
  
  // Fallback to default rates (reverse)
  const fallbackRate = FALLBACK_RATES[sourceCurrency] || 1.0;
  return parseFloat(priceInCurrency) / fallbackRate;
};

