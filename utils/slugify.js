/**
 * Utility function to create a URL-friendly slug from a string
 */

/**
 * Convert a string into a URL-friendly slug
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
const slugify = (text) => {
  if (!text) return '';
  
  // Convert Vietnamese characters to their ASCII equivalents
  // This is a simplified conversion - in a production app you might want more comprehensive Unicode handling
  const vietnameseChars = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
  const asciiChars = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  
  // Convert to lowercase
  let slug = text.toLowerCase();
  
  // Replace Vietnamese characters
  for (let i = 0; i < vietnameseChars.length; i++) {
    slug = slug.replace(new RegExp(vietnameseChars[i], 'g'), asciiChars[i]);
  }
  
  // Replace non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
};

/**
 * Generate a unique slug by appending a number if needed
 * @param {string} baseSlug - The initial slug
 * @param {function} checkExists - Async function that checks if slug exists in DB
 * @returns {Promise<string>} - A unique slug
 */
const generateUniqueSlug = async (baseSlug, checkExists) => {
  let slug = baseSlug;
  let counter = 1;
  let exists = await checkExists(slug);
  
  // Keep adding numbers until we find a unique slug
  while (exists) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    exists = await checkExists(slug);
  }
  
  return slug;
};

module.exports = {
  slugify,
  generateUniqueSlug
}; 