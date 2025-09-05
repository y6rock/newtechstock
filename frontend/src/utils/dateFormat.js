// Date formatting utilities for consistent DD/MM/YYYY format throughout the website

/**
 * Format a date to DD/MM/YYYY format
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date to DD/MM/YYYY HH:MM format
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in DD/MM/YYYY HH:MM format
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format a date to DD/MM/YYYY HH:MM:SS format
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in DD/MM/YYYY HH:MM:SS format
 */
export const formatDateTimeFull = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format a date to short format (DD MMM) for charts and compact displays
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in DD MMM format
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  
  return `${day} ${month}`;
};
