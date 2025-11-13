// Utility for category fallback images
import laptopsImage from '../assets/images/laptops.jpeg';
import smartphonesImage from '../assets/images/smartphones.jpg';
import desktopsImage from '../assets/images/desktops.jpeg';
import gamingMouseImage from '../assets/images/gaming_mouse.jpg';
import keyboardsImage from '../assets/images/keyboards.jpg';
import monitorsImage from '../assets/images/monitors.jpeg';

/**
 * Get fallback image for a category based on its name
 * @param {string} categoryName - The name of the category
 * @returns {string} - Path to the fallback image
 */
export const getCategoryFallbackImage = (categoryName) => {
  if (!categoryName) return laptopsImage; // Default fallback
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('laptop')) return laptopsImage;
  if (name.includes('smartphone') || name.includes('phone')) return smartphonesImage;
  if (name.includes('desktop')) return desktopsImage;
  if (name.includes('mouse')) return gamingMouseImage;
  if (name.includes('keyboard')) return keyboardsImage;
  if (name.includes('monitor')) return monitorsImage;
  
  // Default fallback
  return laptopsImage;
};

