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