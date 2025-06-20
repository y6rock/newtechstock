/**
 * Validates if a date range is valid (start date is before or equal to end date)
 * @param {Date|string} startDate - The start date
 * @param {Date|string} endDate - The end date
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return start <= end;
};

/**
 * Validates if a time range is valid (start time is before end time)
 * @param {string} startTime - The start time in HH:mm format
 * @param {string} endTime - The end time in HH:mm format
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidTimeRange = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Check if times are valid
  if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
    return false;
  }
  
  // Convert to minutes for easier comparison
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return startTotalMinutes < endTotalMinutes;
};

/**
 * Validates if a price is valid (non-negative number)
 * @param {number|string} price - The price to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Validates if a stock quantity is valid (non-negative integer)
 * @param {number|string} stock - The stock quantity to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidStock = (stock) => {
  const numStock = parseInt(stock);
  return !isNaN(numStock) && numStock >= 0 && Number.isInteger(numStock);
};

module.exports = {
  isValidDateRange,
  isValidTimeRange,
  isValidPrice,
  isValidStock
}; 