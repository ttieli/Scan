// HTML transformer for Jest - extracts JavaScript from HTML files for testing

const fs = require('fs');
const path = require('path');

module.exports = {
  process(src, filename) {
    try {
      // Read HTML content
      const htmlContent = fs.readFileSync(filename, 'utf8');
      
      // Extract JavaScript from script tags - more robust approach
      const scriptMatches = htmlContent.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
      
      if (!scriptMatches) {
        return 'module.exports = {};';
      }
      
      // Filter and extract application JavaScript only
      let jsContent = '';
      let foundAppCode = false;
      
      scriptMatches.forEach(script => {
        try {
          // Remove script tags and extract content
          const match = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
          if (!match || !match[1]) return;
          
          const content = match[1].trim();
          
          // Skip empty content
          if (content.length === 0) return;
          
          // Skip external library imports (QRCode.js and jsQR) - check for typical library patterns
          if (content.includes('!function') || 
              content.includes('(function()') ||
              content.includes('(function(') ||
              content.includes('!function(t,e)') ||
              content.includes('var QRCode') ||
              content.includes('var jsQR') ||
              content.length > 20000) { // Very long minified content
            return;
          }
          
          // Include application code that contains our classes
          if (content.includes('class QRDataSender') || 
              content.includes('class QRDataReceiver') ||
              content.includes('QRDataSender') ||
              content.includes('QRDataReceiver') ||
              content.includes('DOMContentLoaded')) {
            jsContent += content + '\n\n';
            foundAppCode = true;
          }
        } catch (scriptError) {
          console.warn(`Warning: Error processing script in ${filename}:`, scriptError.message);
        }
      });
      
      if (!foundAppCode) {
        return 'module.exports = {};';
      }
      
      // Clean up and validate the JavaScript content
      jsContent = jsContent
        .replace(/^\s*\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .trim();
      
      // Wrap in a module export for Jest with error handling
      return `
// Extracted Application JavaScript from ${path.basename(filename)}
try {
  // Import mocks for QR libraries
  const { MockQRCode, mockJsQR } = require('./tests/mocks/qr-libraries');
  
  // Set up global mocks
  global.QRCode = MockQRCode;
  global.jsQR = mockJsQR;
  
  // Application code
  ${jsContent}
  
  // Export for Jest testing
  module.exports = {
    QRDataSender: typeof QRDataSender !== 'undefined' ? QRDataSender : null,
    QRDataReceiver: typeof QRDataReceiver !== 'undefined' ? QRDataReceiver : null,
    QRCode: MockQRCode,
    jsQR: mockJsQR
  };
  
} catch (error) {
  console.error('HTML Transformer Error for ${filename}:', error);
  module.exports = {
    QRDataSender: null,
    QRDataReceiver: null,
    QRCode: null,
    jsQR: null,
    _error: error.message
  };
}
      `.trim();
      
    } catch (error) {
      console.error(`HTML Transformer Failed for ${filename}:`, error);
      return `
module.exports = {
  QRDataSender: null,
  QRDataReceiver: null,
  QRCode: null,
  jsQR: null,
  _error: '${error.message.replace(/'/g, "\\'")}'
};
      `;
    }
  }
};