// Test data factory for generating consistent test data across all test suites

class TestDataFactory {
  static generateText(options = {}) {
    const {
      size = 'medium',
      type = 'ascii',
      includeSpecialChars = false,
      includeMalicious = false
    } = options;

    const sizes = {
      tiny: 10,
      small: 100,
      medium: 500,
      large: 1000,
      huge: 5000,
      max: 10000
    };

    const targetSize = typeof size === 'number' ? size : sizes[size] || sizes.medium;

    let baseText = '';
    let charset = '';

    switch (type) {
      case 'ascii':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
        break;
      case 'unicode':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 你好世界こんにちは🌍🚀💻';
        break;
      case 'special':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}|;:,.<>?';
        break;
      case 'mixed':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 你好🌍!@#$%^&*()';
        break;
    }

    // Generate base content
    for (let i = 0; i < targetSize; i++) {
      baseText += charset[Math.floor(Math.random() * charset.length)];
    }

    if (includeSpecialChars) {
      const specialChars = ['\n', '\r', '\t', '\\', '"', '\''];
      const insertPositions = Math.floor(targetSize * 0.1); // 10% special chars
      
      for (let i = 0; i < insertPositions; i++) {
        const pos = Math.floor(Math.random() * baseText.length);
        const char = specialChars[Math.floor(Math.random() * specialChars.length)];
        baseText = baseText.slice(0, pos) + char + baseText.slice(pos);
      }
    }

    if (includeMalicious) {
      // Insert XSS attempts at random positions
      const maliciousPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '"><script>alert("XSS")</script>',
        'eval("alert(\'XSS\')")'
      ];
      
      const payload = maliciousPayloads[Math.floor(Math.random() * maliciousPayloads.length)];
      const pos = Math.floor(Math.random() * baseText.length);
      baseText = baseText.slice(0, pos) + payload + baseText.slice(pos);
    }

    return baseText;
  }

  static generateSessionData(options = {}) {
    const {
      count = 1,
      type = 'session',
      timestamp = new Date(),
      includeCorrupt = false,
      includeMalicious = false
    } = options;

    const sessions = [];

    for (let i = 0; i < count; i++) {
      const sessionId = `${type}_${timestamp.getTime()}_${i}`;
      const data = this.generateText({ 
        size: 'small',
        includeMalicious 
      });

      let session = {
        id: sessionId,
        timestamp: new Date(timestamp.getTime() + i * 1000).toISOString(),
        type: 'text',
        data: data,
        size: data.length
      };

      if (type === 'manual') {
        session.manual = true;
      }

      if (includeCorrupt && i === Math.floor(count / 2)) {
        // Make one session corrupt
        delete session.data;
        session.corrupted = true;
      }

      sessions.push(session);
    }

    return count === 1 ? sessions[0] : sessions;
  }

  static generateQRCodeData(options = {}) {
    const {
      errorLevel = 'M',
      size = 256,
      includeTimestamp = false,
      dataType = 'text'
    } = options;

    const baseData = {
      text: this.generateText({ size: 'small' }),
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: this.getQRErrorLevel(errorLevel)
    };

    if (includeTimestamp) {
      baseData.timestamp = Date.now();
    }

    if (dataType === 'url') {
      baseData.text = `https://example.com/data/${Date.now()}`;
    } else if (dataType === 'json') {
      baseData.text = JSON.stringify({
        message: this.generateText({ size: 'tiny' }),
        timestamp: Date.now(),
        version: '1.0'
      });
    }

    return baseData;
  }

  static getQRErrorLevel(level) {
    const levels = { L: 1, M: 2, Q: 3, H: 4 };
    return levels[level] || levels.M;
  }

  static generateImageData(width = 640, height = 480, hasQR = true) {
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Fill with noise
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.random() * 255;     // Red
      data[i + 1] = Math.random() * 255; // Green
      data[i + 2] = Math.random() * 255; // Blue
      data[i + 3] = 255;                 // Alpha
    }

    if (hasQR) {
      // Add QR-like pattern in corners (position markers)
      const markerSize = Math.floor(width / 20);
      const markers = [
        { x: 0, y: 0 },                           // Top-left
        { x: width - markerSize, y: 0 },          // Top-right
        { x: 0, y: height - markerSize }          // Bottom-left
      ];

      markers.forEach(marker => {
        for (let y = marker.y; y < marker.y + markerSize; y++) {
          for (let x = marker.x; x < marker.x + markerSize; x++) {
            if (x < width && y < height) {
              const index = (y * width + x) * 4;
              data[index] = 0;     // Black
              data[index + 1] = 0;
              data[index + 2] = 0;
              data[index + 3] = 255;
            }
          }
        }
      });

      // Add some data pattern
      for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * (width - markerSize * 2)) + markerSize;
        const y = Math.floor(Math.random() * (height - markerSize * 2)) + markerSize;
        const blockSize = 3;

        for (let by = y; by < y + blockSize; by++) {
          for (let bx = x; bx < x + blockSize; bx++) {
            if (bx < width && by < height) {
              const index = (by * width + bx) * 4;
              const isDark = Math.random() > 0.5;
              const color = isDark ? 0 : 255;
              data[index] = color;
              data[index + 1] = color;
              data[index + 2] = color;
              data[index + 3] = 255;
            }
          }
        }
      }
    }

    return {
      data,
      width,
      height
    };
  }

  static generateMaliciousInputs() {
    return {
      xss: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '"><script>alert("XSS")</script>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<svg onload="alert(\'XSS\')">',
        '<body onload="alert(\'XSS\')">',
        'eval("alert(\'XSS\')")',
        'Function("alert(\'XSS\')")()',
        'setTimeout("alert(\'XSS\')", 100)'
      ],
      
      injection: [
        '\'); DROP TABLE users; --',
        '1\' OR \'1\'=\'1',
        '"; system("rm -rf /"); --',
        '{{7*7}}',
        '${alert("XSS")}',
        '#{alert("XSS")}',
        '<%= system("whoami") %>',
        '{{constructor.constructor("alert(1)")()}}'
      ],
      
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        'C:\\Windows\\System32\\config\\SAM',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ],
      
      prototypePollution: [
        '{"__proto__": {"polluted": true}}',
        '{"constructor": {"prototype": {"polluted": true}}}',
        '__proto__.polluted = true',
        'constructor.prototype.polluted = true'
      ],

      oversized: [
        'A'.repeat(1000000),    // 1MB
        'X'.repeat(10000000),   // 10MB
        '\0'.repeat(100000),    // Null bytes
        'µ'.repeat(500000)      // Unicode
      ]
    };
  }

  static generatePerformanceTestData() {
    return {
      sizes: [
        { name: 'Tiny (10 chars)', size: 10 },
        { name: 'Small (100 chars)', size: 100 },
        { name: 'Medium (500 chars)', size: 500 },
        { name: 'Large (1KB)', size: 1000 },
        { name: 'Very Large (5KB)', size: 5000 },
        { name: 'Huge (10KB)', size: 10000 },
        { name: 'Extreme (50KB)', size: 50000 }
      ],

      qrSizes: [128, 256, 384, 512],
      
      errorLevels: ['L', 'M', 'Q', 'H'],
      
      intervals: [100, 500, 1000, 1500, 2000, 3000],

      iterations: {
        light: 10,
        medium: 50,
        heavy: 100,
        stress: 500
      }
    };
  }

  static generateE2ETestScenarios() {
    return [
      {
        name: 'Basic QR Generation',
        steps: [
          { action: 'fillText', target: '#textInput', value: 'Hello World' },
          { action: 'click', target: '#generateBtn' },
          { action: 'waitFor', target: '#qrDisplay canvas' },
          { action: 'expect', target: '#qrDisplay canvas', condition: 'toBeVisible' }
        ]
      },
      
      {
        name: 'QR Data Processing',
        steps: [
          { action: 'processQR', data: 'Test QR Data' },
          { action: 'expect', target: '#receivedData', condition: 'toHaveValue', value: 'Test QR Data' },
          { action: 'expect', target: '#resultsSection', condition: 'toBeVisible' }
        ]
      },

      {
        name: 'Storage Operations',
        steps: [
          { action: 'processQR', data: 'Storage test data' },
          { action: 'click', target: '#saveToStorageBtn' },
          { action: 'expect', target: '.status', condition: 'toContainText', value: '已保存' }
        ]
      },

      {
        name: 'Settings Configuration',
        steps: [
          { action: 'fill', target: '#qrSizeInput', value: '512' },
          { action: 'fill', target: '#intervalInput', value: '2000' },
          { action: 'fillText', target: '#textInput', value: 'Settings test' },
          { action: 'click', target: '#generateBtn' },
          { action: 'waitFor', target: '#qrDisplay canvas' },
          { action: 'expectAttribute', target: '#qrDisplay canvas', attribute: 'width', value: '512' }
        ]
      },

      {
        name: 'Error Handling',
        steps: [
          { action: 'fillText', target: '#textInput', value: '' },
          { action: 'click', target: '#generateBtn' },
          { action: 'expect', target: '.status.warning', condition: 'toBeVisible' }
        ]
      }
    ];
  }

  static generateMockDevices() {
    return [
      {
        name: 'Desktop Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        hasCamera: true,
        hasTouchscreen: false
      },
      
      {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        hasCamera: true,
        hasTouchscreen: true
      },

      {
        name: 'Android Phone',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        viewport: { width: 360, height: 740 },
        hasCamera: true,
        hasTouchscreen: true
      },

      {
        name: 'iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024 },
        hasCamera: true,
        hasTouchscreen: true
      },

      {
        name: 'Desktop No Camera',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1366, height: 768 },
        hasCamera: false,
        hasTouchscreen: false
      }
    ];
  }

  static createTestSuite(suiteName, testCount = 10) {
    const suite = {
      name: suiteName,
      timestamp: new Date().toISOString(),
      tests: []
    };

    for (let i = 0; i < testCount; i++) {
      suite.tests.push({
        id: `${suiteName.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
        name: `${suiteName} Test ${i + 1}`,
        data: this.generateText({ size: 'small' }),
        expected: 'success',
        timeout: 5000
      });
    }

    return suite;
  }

  static generateRandomSeed(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateTimestamp(offset = 0) {
    return new Date(Date.now() + offset).toISOString();
  }

  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestDataFactory;
}

if (typeof window !== 'undefined') {
  window.TestDataFactory = TestDataFactory;
}

if (typeof global !== 'undefined') {
  global.TestDataFactory = TestDataFactory;
}