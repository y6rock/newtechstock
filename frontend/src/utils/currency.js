// src/utils/currency.js
import { calculatePriceWithTax } from './tax';

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
 * Format price with tax included for customer display
 * @param {number} basePrice - Base price without tax
 * @param {string} currencyCode - Currency code
 * @param {number} taxRate - Tax rate percentage (default 18%)
 * @returns {string} Formatted price with tax
 */
export const formatPriceWithTax = (basePrice, currencyCode, taxRate = 18) => {
    const priceWithTax = calculatePriceWithTax(basePrice, taxRate);
    return formatPrice(priceWithTax, currencyCode);
};

/**
 * Format base price (without tax) for admin display
 * @param {number} basePrice - Base price without tax
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted base price
 */
export const formatBasePrice = (basePrice, currencyCode) => {
    return formatPrice(basePrice, currencyCode);
}; 