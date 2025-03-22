/**
 * Utility functions for converting HTML content to and from various formats
 */

const striptags = require('striptags');

/**
 * Convert HTML content to plain text
 * @param {string} html - HTML content from CKEditor
 * @returns {string} - Plain text content
 */
const htmlToPlainText = (html) => {
  if (!html) return '';
  return striptags(html).trim();
};

/**
 * Convert HTML content to a simplified JSON format for mobile apps
 * This preserves some basic formatting while making it easier to render on mobile
 * @param {string} html - HTML content from CKEditor
 * @returns {Array} - Array of content blocks
 */
const htmlToMobileFormat = (html) => {
  if (!html) return [];
  
  // Simple conversion that preserves paragraphs, headings, images and lists
  // In a real app, you might want to use a proper HTML parser like cheerio
  
  // Split content by major blocks
  const blocks = [];
  
  // Replace <img> tags with placeholders
  let processedHtml = html.replace(/<img[^>]+src="([^"]+)"[^>]*>/g, (match, src) => {
    blocks.push({
      type: 'image',
      content: src
    });
    return `[IMG_PLACEHOLDER_${blocks.length - 1}]`;
  });
  
  // Process other elements
  const lines = processedHtml.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>|<p[^>]*>.*?<\/p>|<ul[^>]*>.*?<\/ul>|<ol[^>]*>.*?<\/ol>)/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Check for image placeholders
    if (line.includes('[IMG_PLACEHOLDER_')) {
      // Skip as we already added images to the blocks array
      continue;
    }
    
    // Check for headings
    if (line.match(/<h[1-6][^>]*>/)) {
      const text = striptags(line).trim();
      if (text) {
        blocks.push({
          type: 'heading',
          content: text
        });
      }
      continue;
    }
    
    // Check for paragraphs
    if (line.match(/<p[^>]*>/)) {
      const text = striptags(line).trim();
      if (text) {
        blocks.push({
          type: 'paragraph',
          content: text
        });
      }
      continue;
    }
    
    // Check for lists
    if (line.match(/<[ou]l[^>]*>/)) {
      const items = line.match(/<li[^>]*>(.*?)<\/li>/g);
      if (items && items.length > 0) {
        const listItems = items.map(item => striptags(item).trim()).filter(item => item);
        blocks.push({
          type: line.startsWith('<ul') ? 'unordered-list' : 'ordered-list',
          content: listItems
        });
      }
      continue;
    }
    
    // For any remaining content
    const text = striptags(line).trim();
    if (text) {
      blocks.push({
        type: 'paragraph',
        content: text
      });
    }
  }
  
  return blocks;
};

module.exports = {
  htmlToPlainText,
  htmlToMobileFormat
}; 