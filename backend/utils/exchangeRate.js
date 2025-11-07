// Exchange rate utility for backend - converts from ILS (base currency) to target currency
// Uses exchangerate-api.com free tier (no API key required for basic usage)

const axios = require('axios');

// Fallback exchange rates (updated periodically, used if API fails)
const FALLBACK_RATES = {
  USD: 0.27, // 1 ILS = 0.27 USD (approx 1 USD = 3.7 ILS)
  EUR: 0.25, // 1 ILS = 0.25 EUR (approx 1 EUR = 4.0 ILS)
  GBP: 0.21, // 1 ILS = 0.21 GBP (approx 1 GBP = 4.75 ILS)
  ILS: 1.0   // Base currency
};

let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates from API
 */
const fetchExchangeRates = async () => {
  try {
    // Using exchangerate-api.com free endpoint (no API key needed)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/ILS', {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data && response.data.rates) {
      cachedRates = response.data.rates;
      cacheTimestamp = Date.now();
      return response.data.rates;
    }
    
    throw new Error('Invalid exchange rate data');
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
    // Return fallback rates if API fails
    return FALLBACK_RATES;
  }
};

/**
 * Get exchange rates (from cache or API)
 */
const getExchangeRates = async () => {
  const now = Date.now();
  
  // Check cache first
  if (cachedRates && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRates;
  }
  
  // Fetch fresh rates
  return await fetchExchangeRates();
};

/**
 * Get exchange rate for a specific currency
 * @param {string} targetCurrency - Target currency code (USD, EUR, GBP, ILS)
 * @returns {Promise<number>} Exchange rate (1 ILS = X targetCurrency)
 */
const getExchangeRate = async (targetCurrency) => {
  if (targetCurrency === 'ILS') {
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
const convertFromILS = async (priceInILS, targetCurrency) => {
  if (!priceInILS || isNaN(parseFloat(priceInILS))) {
    return 0;
  }
  
  if (targetCurrency === 'ILS') {
    return parseFloat(priceInILS);
  }
  
  const rate = await getExchangeRate(targetCurrency);
  return parseFloat(priceInILS) * rate;
};

module.exports = {
  getExchangeRates,
  getExchangeRate,
  convertFromILS
};

