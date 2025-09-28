/**
 * Tax calculation utilities
 */

/**
 * Calculate price with tax included
 * @param {number} basePrice - Price without tax
 * @param {number} taxRate - Tax rate as percentage (e.g., 18 for 18%)
 * @returns {number} Price with tax included
 */
export const calculatePriceWithTax = (basePrice, taxRate = 18) => {
  const price = parseFloat(basePrice) || 0;
  const rate = parseFloat(taxRate) || 0;
  return price * (1 + rate / 100);
};

/**
 * Calculate tax amount from base price
 * @param {number} basePrice - Price without tax
 * @param {number} taxRate - Tax rate as percentage (e.g., 18 for 18%)
 * @returns {number} Tax amount
 */
export const calculateTaxAmount = (basePrice, taxRate = 18) => {
  const price = parseFloat(basePrice) || 0;
  const rate = parseFloat(taxRate) || 0;
  return price * (rate / 100);
};

/**
 * Calculate base price from price with tax
 * @param {number} priceWithTax - Price including tax
 * @param {number} taxRate - Tax rate as percentage (e.g., 18 for 18%)
 * @returns {number} Base price without tax
 */
export const calculateBasePriceFromTaxIncluded = (priceWithTax, taxRate = 18) => {
  const price = parseFloat(priceWithTax) || 0;
  const rate = parseFloat(taxRate) || 0;
  return price / (1 + rate / 100);
};
