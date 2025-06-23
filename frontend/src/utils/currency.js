// src/utils/currency.js

export const getCurrencySymbol = (currencyCode) => {
    const symbols = {
        'ILS': '₪',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    };
    return symbols[currencyCode] || '$';
};

export const formatPrice = (price, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    const amount = parseFloat(price).toFixed(2);
    return `${symbol}${amount}`;
}; 