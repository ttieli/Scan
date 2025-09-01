// Mock implementations for QR code libraries (QRCode.js and jsQR)

// Mock QRCode library (sender)
class MockQRCode {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      text: options.text || '',
      width: options.width || 256,
      height: options.height || 256,
      colorDark: options.colorDark || '#000000',
      colorLight: options.colorLight || '#ffffff',
      correctLevel: options.correctLevel || MockQRCode.CorrectLevel.M
    };
    
    this.makeCode(this.options.text);
  }
  
  makeCode(text) {
    if (!text) {
      throw new Error('Text is required for QR code generation');
    }
    
    // Simulate QR code size limitations
    if (text.length > 4296) { // Approximate limit for high error correction
      throw new Error('Text too long for QR code');
    }
    
    // Create mock canvas element
    if (this.element) {
      const canvas = this._createMockCanvas();
      this._drawMockQRPattern(canvas, text);
      
      // Clear existing content
      this.element.innerHTML = '';
      this.element.appendChild(canvas);
    }
    
    return this;
  }
  
  clear() {
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
  
  _createMockCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.options.width;
    canvas.height = this.options.height;
    return canvas;
  }
  
  _drawMockQRPattern(canvas, text) {
    const ctx = canvas.getContext('2d');
    
    // Draw mock QR pattern
    ctx.fillStyle = this.options.colorLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = this.options.colorDark;
    
    // Draw position markers (corners)
    const markerSize = Math.floor(canvas.width / 8);
    
    // Top-left marker
    ctx.fillRect(0, 0, markerSize, markerSize);
    // Top-right marker  
    ctx.fillRect(canvas.width - markerSize, 0, markerSize, markerSize);
    // Bottom-left marker
    ctx.fillRect(0, canvas.height - markerSize, markerSize, markerSize);
    
    // Draw data pattern based on text content
    const blockSize = Math.floor(canvas.width / 25);
    for (let i = 0; i < text.length && i < 100; i++) {
      const char = text.charCodeAt(i);
      const x = (char * 7) % (canvas.width - blockSize);
      const y = (char * 11) % (canvas.height - blockSize);
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
  
  // Static methods and properties
  static CorrectLevel = {
    L: 1, // Low ~7%
    M: 2, // Medium ~15%
    Q: 3, // Quartile ~25%
    H: 4  // High ~30%
  };
}

// Mock jsQR library (receiver)
const mockJsQR = (data, width, height, options = {}) => {
  // Return null if no data provided (simulating no QR code found)
  if (!data || data.length === 0) {
    return null;
  }
  
  // Simple pattern matching to detect if image data might contain a QR code
  const hasQRPattern = mockJsQR._detectQRPattern(data, width, height);
  
  if (!hasQRPattern) {
    return null;
  }
  
  // Extract mock data from the pattern
  const decodedText = mockJsQR._extractMockData(data, width, height);
  
  if (!decodedText) {
    return null;
  }
  
  return {
    data: decodedText,
    binaryData: new Uint8Array(decodedText.split('').map(char => char.charCodeAt(0))),
    location: {
      topLeftCorner: { x: 10, y: 10 },
      topRightCorner: { x: width - 10, y: 10 },
      bottomLeftCorner: { x: 10, y: height - 10 },
      bottomRightCorner: { x: width - 10, y: height - 10 }
    }
  };
};

// Helper methods for jsQR mock
mockJsQR._detectQRPattern = (data, width, height) => {
  // Look for position markers (dark squares in corners)
  const checkCorner = (x, y, size) => {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const index = ((y + dy) * width + (x + dx)) * 4;
        if (index >= data.length) return false;
        
        // Check if pixel is dark (low RGB values)
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness > 128) return false; // Should be dark
      }
    }
    return true;
  };
  
  const markerSize = Math.floor(width / 8);
  
  // Check for position markers in corners
  const hasTopLeft = checkCorner(0, 0, Math.min(markerSize, 20));
  const hasTopRight = checkCorner(width - markerSize, 0, Math.min(markerSize, 20));
  const hasBottomLeft = checkCorner(0, height - markerSize, Math.min(markerSize, 20));
  
  return hasTopLeft && hasTopRight && hasBottomLeft;
};

mockJsQR._extractMockData = (data, width, height) => {
  // Simple extraction based on pixel patterns
  let extractedData = '';
  const blockSize = Math.floor(width / 25);
  
  // Sample data blocks to reconstruct text
  for (let y = blockSize; y < height - blockSize; y += blockSize * 2) {
    for (let x = blockSize; x < width - blockSize; x += blockSize * 2) {
      const index = (y * width + x) * 4;
      if (index < data.length) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 128) { // Dark pixel represents data
          const charCode = ((x + y) % 95) + 32; // ASCII printable range
          extractedData += String.fromCharCode(charCode);
        }
      }
    }
  }
  
  // Return a cleaned up version or use stored mock data
  return extractedData.trim() || mockJsQR._getMockDataForTesting();
};

mockJsQR._getMockDataForTesting = () => {
  // Return predefined test data when pattern extraction doesn't work
  return mockJsQR._testData || 'Mock QR Data';
};

mockJsQR._setTestData = (data) => {
  mockJsQR._testData = data;
};

mockJsQR._clearTestData = () => {
  mockJsQR._testData = null;
};

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockQRCode,
    mockJsQR
  };
}

// Global assignment for browser environment
if (typeof global !== 'undefined') {
  global.QRCode = MockQRCode;
  global.jsQR = mockJsQR;
}

if (typeof window !== 'undefined') {
  window.QRCode = MockQRCode;
  window.jsQR = mockJsQR;
}