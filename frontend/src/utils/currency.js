// src/utils/currency.js
import { calculatePriceWithTax } from './tax';
import { convertFromILSSync } from './exchangeRate';

export const getCurrencySymbol = (currencyCode) => {
    const symbols = {
        'ILS': '₪',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    };
    return symbols[currencyCode] || '₪';
};

// Function to add commas to numbers
export const formatNumberWithCommas = (number) => {
    if (!number || isNaN(parseFloat(number))) return '0';
    return parseFloat(number).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

export const formatPrice = (price, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    
    // Handle invalid or null price values
    if (!price || isNaN(parseFloat(price)) || price === null || price === undefined) {
        return `${symbol}0.00`;
    }
    
    const amount = parseFloat(price).toFixed(2);
    // Add commas to the amount before the decimal point
    const parts = amount.split('.');
    const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedAmount = parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
    
    return `${symbol}${formattedAmount}`;
};

/**
 * Convert price from ILS (base currency) to target currency and format
 * @param {number} priceInILS - Price in Israeli Shekels (stored in database)
 * @param {string} currencyCode - Target currency code
 * @returns {string} Formatted price in target currency
 */
export const formatPriceConverted = (priceInILS, currencyCode) => {
    // Convert from ILS to target currency
    const convertedPrice = convertFromILSSync(priceInILS, currencyCode);
    return formatPrice(convertedPrice, currencyCode);
};

/**
 * Format price with tax included for customer display
 * Converts from ILS (base) to target currency, then adds tax
 * @param {number} basePriceInILS - Base price in ILS (without tax)
 * @param {string} currencyCode - Target currency code
 * @param {number} taxRate - Tax rate percentage (default 18%)
 * @returns {string} Formatted price with tax in target currency
 */
export const formatPriceWithTax = (basePriceInILS, currencyCode, taxRate = 18) => {
    // First convert from ILS to target currency
    const convertedBasePrice = convertFromILSSync(basePriceInILS, currencyCode);
    // Then add tax
    const priceWithTax = calculatePriceWithTax(convertedBasePrice, taxRate);
    return formatPrice(priceWithTax, currencyCode);
};

/**
 * Format base price (without tax) for admin display
 * Converts from ILS (base) to target currency
 * @param {number} basePriceInILS - Base price in ILS (without tax)
 * @param {string} currencyCode - Target currency code
 * @returns {string} Formatted base price in target currency
 */
export const formatBasePrice = (basePriceInILS, currencyCode) => {
    const convertedPrice = convertFromILSSync(basePriceInILS, currencyCode);
    return formatPrice(convertedPrice, currencyCode);
}; 