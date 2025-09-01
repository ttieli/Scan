// Security tests for data validation and input sanitization

const fs = require('fs');
const path = require('path');

describe('Data Validation and Security', () => {
  let senderHTML, receiverHTML;

  beforeAll(() => {
    const senderPath = path.join(__dirname, '../../sender.html');
    const receiverPath = path.join(__dirname, '../../receiver.html');
    senderHTML = fs.readFileSync(senderPath, 'utf8');
    receiverHTML = fs.readFileSync(receiverPath, 'utf8');
  });

  beforeEach(() => {
    document.documentElement.innerHTML = '';
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Input Validation', () => {
    test('should validate text input boundaries', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      // Test empty input
      sender.textInput.value = '';
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      sender.generateQRCode();
      expect(showStatusSpy).toHaveBeenCalledWith('请输入要传输的文本', 'warning');

      // Test whitespace-only input
      sender.textInput.value = '   \n\t   ';
      sender.generateQRCode();
      expect(showStatusSpy).toHaveBeenCalledWith('请输入要传输的文本', 'warning');

      // Test valid input
      sender.textInput.value = 'Valid input';
      sender.generateQRCode();
      expect(sender.frames).toEqual(['Valid input']);
    });

    test('should handle extremely long input securely', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();
      
      // Test with maximum allowed size
      const maxInput = 'A'.repeat(10000);
      sender.textInput.value = maxInput;
      
      expect(() => {
        sender.generateQRCode();
      }).not.toThrow();
      
      expect(sender.frames).toEqual([maxInput]);

      // Test with extremely large input (potential DoS)
      const hugeInput = 'B'.repeat(1000000);
      sender.textInput.value = hugeInput;
      
      // Should handle gracefully without hanging or crashing
      const startTime = Date.now();
      sender.generateQRCode();
      const endTime = Date.now();
      
      // Should complete in reasonable time (not hang)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(sender.frames).toEqual([hugeInput]);
    });

    test('should validate configuration parameters securely', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      // Test invalid QR size values
      const invalidSizes = [-1, 0, 9999, 'invalid', null, undefined, NaN, Infinity];
      
      invalidSizes.forEach(size => {
        sender.config.qrSize = size;
        sender.textInput.value = 'test';
        
        expect(() => {
          sender.generateQRCode();
        }).not.toThrow();
        
        // Should use a sensible default or handle gracefully
        expect(global.QRCode).toHaveBeenCalled();
      });

      // Test invalid interval values
      const invalidIntervals = [-100, 0, 'malicious', {}, [], null];
      
      invalidIntervals.forEach(interval => {
        sender.config.interval = interval;
        
        expect(() => {
          sender.startPlayback();
        }).not.toThrow();
      });
    });

    test('should sanitize error correction level input', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      // Test malicious error correction values
      const maliciousLevels = [
        'alert("XSS")',
        '<script>evil()</script>',
        '../../etc/passwd',
        'null',
        'undefined',
        'constructor',
        '__proto__'
      ];

      maliciousLevels.forEach(level => {
        sender.config.errorCorrectionLevel = level;
        sender.textInput.value = 'test';
        
        expect(() => {
          sender.generateQRCode();
        }).not.toThrow();
        
        expect(window.alert).not.toHaveBeenCalled();
      });
    });
  });

  describe('QR Data Validation', () => {
    test('should validate QR scan data integrity', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Test various malformed QR data
      const malformedData = [
        null,
        undefined,
        '',
        '\0\0\0',
        'a'.repeat(100000), // Extremely long
        String.fromCharCode(0x00, 0x01, 0x02), // Control characters
        '\uFFFD\uFFFE\uFFFF' // Invalid Unicode
      ];

      malformedData.forEach(data => {
        expect(() => {
          receiver.processQRCode(data);
        }).not.toThrow();
        
        // Should handle gracefully
        if (data) {
          expect(receiver.receivedData.value).toBe(data);
        }
      });
    });

    test('should prevent injection through QR data', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      const injectionAttempts = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'onclick="alert(\'XSS\')"',
        '"><script>alert("XSS")</script>',
        '\');alert(\'XSS\');//',
        '{{7*7}}', // Template injection
        '${alert("XSS")}', // Template literal injection
        'eval("alert(\'XSS\')")'
      ];

      injectionAttempts.forEach(injection => {
        receiver.processQRCode(injection);
        
        // Data should be stored as text, not executed
        expect(receiver.receivedData.value).toBe(injection);
        expect(window.alert).not.toHaveBeenCalled();
      });
    });

    test('should validate binary data and non-text content', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Test binary-like data
      const binaryData = Array.from({length: 256}, (_, i) => String.fromCharCode(i)).join('');
      
      expect(() => {
        receiver.processQRCode(binaryData);
      }).not.toThrow();

      expect(receiver.receivedData.value).toBe(binaryData);

      // Test data with mixed encodings
      const mixedData = 'ASCII\x00Binary\x01Data\xFF\xFE';
      
      expect(() => {
        receiver.processQRCode(mixedData);
      }).not.toThrow();

      expect(receiver.receivedData.value).toBe(mixedData);
    });
  });

  describe('Storage Security', () => {
    test('should validate localStorage key security', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Attempt to access malicious keys
      const maliciousKeys = [
        '../../../etc/passwd',
        'C:\\Windows\\System32\\config\\SAM',
        '__proto__',
        'constructor',
        'prototype',
        'eval',
        'Function'
      ];

      maliciousKeys.forEach(key => {
        expect(() => {
          receiver.loadSession(key);
        }).not.toThrow();
        
        // Should not load unauthorized data
        expect(receiver.receivedData.value).toBe('');
      });
    });

    test('should prevent localStorage data tampering', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Store legitimate data
      const originalData = 'Legitimate data';
      receiver.autoSaveData(originalData);

      // Attempt to tamper with stored data
      const keys = Object.keys(localStorage.store);
      const sessionKey = keys[0];
      
      // Try various tampering attempts
      const tamperingAttempts = [
        '{"data": "Tampered", "malicious": true}',
        '{"__proto__": {"polluted": true}, "data": "evil"}',
        '{"constructor": "evil", "data": "tampered"}',
        'malicious non-JSON data',
        '{"data": "<script>alert(\'XSS\')</script>"}',
        null,
        undefined
      ];

      tamperingAttempts.forEach(tamperedData => {
        localStorage.setItem(sessionKey, tamperedData);
        
        expect(() => {
          receiver.loadSession(sessionKey);
        }).not.toThrow();
        
        // Should handle gracefully without executing malicious code
        expect(window.alert).not.toHaveBeenCalled();
      });
    });

    test('should validate session data structure', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Test with malformed session structures
      const malformedSessions = [
        { id: null, data: 'test' },
        { data: null, id: 'test' },
        { id: 'test', data: 'test', size: -1 },
        { id: 'test', data: 'test', timestamp: 'invalid date' },
        { id: 'test', data: 'test', type: 'invalid' },
        { // Missing required fields
          timestamp: new Date().toISOString()
        },
        { // Prototype pollution attempt
          __proto__: { polluted: true },
          id: 'evil',
          data: 'tampered'
        }
      ];

      malformedSessions.forEach((session, index) => {
        const key = `malformed_${index}`;
        localStorage.setItem(key, JSON.stringify(session));
        
        expect(() => {
          receiver.loadSession(key);
        }).not.toThrow();
        
        // Should not pollute prototypes
        expect(Object.prototype.polluted).toBeUndefined();
      });
    });

    test('should prevent storage quota abuse', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Set a small quota for testing
      localStorage._setQuota(1024); // 1KB limit

      // Attempt to store data that exceeds quota
      const largeData = 'X'.repeat(2000);
      
      expect(() => {
        receiver.autoSaveData(largeData);
      }).toThrow('QuotaExceededError');

      // Should not crash the application
      expect(() => {
        receiver.processQRCode('Small data after quota error');
      }).not.toThrow();
    });
  });

  describe('DOM Manipulation Security', () => {
    test('should prevent DOM-based XSS in dynamic content', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Add malicious session data
      const maliciousSession = {
        id: '"><script>alert("XSS")</script>',
        timestamp: 'javascript:alert("XSS2")',
        data: '<img src="x" onerror="alert(\'XSS3\')">',
        size: 100
      };

      localStorage.setItem('malicious_session', JSON.stringify(maliciousSession));

      // Load and display sessions
      expect(() => {
        receiver.loadStoredSessions();
      }).not.toThrow();

      expect(window.alert).not.toHaveBeenCalled();

      // Check that the HTML is properly escaped
      const storedHTML = receiver.storedSessions.innerHTML;
      expect(storedHTML).not.toContain('<script>');
      expect(storedHTML).not.toContain('javascript:');
      expect(storedHTML).not.toContain('onerror=');
    });

    test('should validate innerHTML assignments', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      // Monitor innerHTML assignments
      let dangerousHTMLAssigned = false;
      const originalSetInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
      
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          if (typeof value === 'string' && value.includes('<script>')) {
            dangerousHTMLAssigned = true;
          }
          return originalSetInnerHTML.call(this, value);
        },
        get: function() {
          return this._innerHTML || '';
        },
        configurable: true
      });

      // Perform operations that might set innerHTML
      sender.textInput.value = '<script>alert("XSS")</script>';
      sender.generateQRCode();
      sender.showStatus('Status with <script>alert("XSS")</script>', 'info');
      sender.clearAll();

      expect(dangerousHTMLAssigned).toBe(false);

      // Restore original descriptor
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: originalSetInnerHTML,
        get: function() { return this._innerHTML || ''; },
        configurable: true
      });
    });

    test('should prevent event handler injection', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const receiver = new QRDataReceiver();

      // Add session with potential event handler injection
      const sessionWithHandlers = {
        id: 'onclick="alert(\'XSS\')"',
        timestamp: 'onload="alert(\'XSS2\')"',
        data: 'onmouseover="alert(\'XSS3\')"',
        size: 100
      };

      localStorage.setItem('handler_session', JSON.stringify(sessionWithHandlers));
      receiver.loadStoredSessions();

      // Check that no event handlers were added
      const sessionItems = receiver.storedSessions.querySelectorAll('*');
      sessionItems.forEach(element => {
        const attributes = element.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attr = attributes[i];
          expect(attr.name).not.toMatch(/^on[a-z]+$/i);
        }
      });

      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  describe('File Security', () => {
    test('should validate file input security', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      // File input should be disabled in Phase 1
      expect(sender.fileInput.disabled).toBe(true);

      // Even if enabled, should validate file types
      sender.fileInput.disabled = false;
      
      // Mock File object with malicious content
      const maliciousFile = {
        name: '../../../etc/passwd',
        type: 'text/html',
        size: 100000000, // Very large file
        lastModified: Date.now()
      };

      // Simulate file selection (though it's disabled)
      Object.defineProperty(sender.fileInput, 'files', {
        value: [maliciousFile],
        configurable: true
      });

      // Should not process malicious files
      expect(() => {
        // File processing would happen here in future phases
        if (sender.fileInput.files.length > 0) {
          const file = sender.fileInput.files[0];
          // Validate file
          expect(file.size).toBeLessThan(10 * 1024 * 1024); // 10MB limit
          expect(file.name).not.toMatch(/\.\./); // No path traversal
        }
      }).not.toThrow();
    });
  });

  describe('URL Security', () => {
    test('should validate and sanitize URLs', () => {
      // Test URL handling in status messages and other contexts
      const maliciousURLs = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:msgbox("XSS")',
        'file:///etc/passwd',
        'ftp://malicious.com/evil',
        'http://evil.com/malware.exe'
      ];

      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const sender = new QRDataSender();

      maliciousURLs.forEach(url => {
        // Test URL in various contexts
        sender.showStatus(`Click here: ${url}`, 'info');
        
        expect(window.alert).not.toHaveBeenCalled();
        
        // Status should display the URL as text, not make it clickable
        const statusContent = sender.statusContainer.textContent;
        expect(statusContent).toContain(url);
      });
    });
  });
});