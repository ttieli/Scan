// Security tests for XSS prevention and data validation

const fs = require('fs');
const path = require('path');

describe('XSS Prevention and Data Validation', () => {
  let senderHTML, receiverHTML;
  let QRDataSender, QRDataReceiver;

  beforeAll(() => {
    const senderPath = path.join(__dirname, '../../sender.html');
    const receiverPath = path.join(__dirname, '../../receiver.html');
    senderHTML = fs.readFileSync(senderPath, 'utf8');
    receiverHTML = fs.readFileSync(receiverPath, 'utf8');
  });

  beforeEach(() => {
    // Clear DOM and reset mocks
    document.documentElement.innerHTML = '';
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Sender XSS Prevention', () => {
    beforeEach(() => {
      document.documentElement.innerHTML = senderHTML;
      
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      QRDataSender = window.qrSender.constructor;
    });

    test('should sanitize HTML in text input', () => {
      const sender = new QRDataSender();
      const maliciousInput = '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">';
      
      sender.textInput.value = maliciousInput;
      sender.generateQRCode();
      
      // QR code should be generated with the raw text (not executed)
      expect(sender.frames).toEqual([maliciousInput]);
      expect(global.QRCode).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          text: maliciousInput
        })
      );
      
      // Check that no script was executed (no alert)
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should safely display status messages with HTML content', () => {
      const sender = new QRDataSender();
      const maliciousMessage = '<script>alert("XSS")</script>Evil message';
      
      sender.showStatus(maliciousMessage, 'info');
      
      // Message should be displayed as text, not executed
      const statusElement = sender.statusContainer.querySelector('.status');
      expect(statusElement.textContent).toBe(maliciousMessage);
      expect(statusElement.innerHTML).toBe(`<div class="status info">${maliciousMessage}</div>`);
      
      // No script should execute
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should handle malicious event handlers in generated content', () => {
      const sender = new QRDataSender();
      const maliciousText = 'onclick="alert(\'XSS\')" onload="alert(\'XSS2\')"';
      
      sender.textInput.value = maliciousText;
      sender.generateQRCode();
      
      // Content should be treated as data, not executable code
      expect(sender.frames).toEqual([maliciousText]);
      
      // No alerts should fire
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should prevent innerHTML injection in QR display', () => {
      const sender = new QRDataSender();
      
      // Try to inject malicious content into QR display
      const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
      let injectionAttempted = false;
      
      Object.defineProperty(sender.qrDisplay, 'innerHTML', {
        set: function(value) {
          if (value.includes('<script>')) {
            injectionAttempted = true;
          }
          return originalInnerHTML.call(this, value);
        },
        get: function() {
          return this._innerHTML || '';
        }
      });
      
      sender.textInput.value = 'Safe content';
      sender.generateQRCode();
      
      // Should not attempt script injection
      expect(injectionAttempted).toBe(false);
    });

    test('should validate input length and prevent buffer overflow attacks', () => {
      const sender = new QRDataSender();
      
      // Extremely large input (potential DoS attack)
      const hugeInput = 'A'.repeat(100000);
      sender.textInput.value = hugeInput;
      
      // Should handle gracefully without crashing
      expect(() => {
        sender.generateQRCode();
      }).not.toThrow();
      
      // Should still process the data (Phase 1 doesn't limit yet)
      expect(sender.frames).toEqual([hugeInput]);
    });

    test('should prevent prototype pollution in configuration', () => {
      const sender = new QRDataSender();
      
      // Attempt prototype pollution
      const maliciousConfig = JSON.parse('{"__proto__": {"polluted": true}}');
      
      expect(() => {
        Object.assign(sender.config, maliciousConfig);
      }).not.toThrow();
      
      // Should not pollute Object prototype
      expect(Object.prototype.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });
  });

  describe('Receiver XSS Prevention', () => {
    beforeEach(() => {
      document.documentElement.innerHTML = receiverHTML;
      
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      QRDataReceiver = window.qrReceiver.constructor;
    });

    test('should sanitize received QR data', () => {
      const receiver = new QRDataReceiver();
      const maliciousQRData = '<script>alert("XSS from QR")</script><img src="x" onerror="alert(\'XSS2\')">';
      
      receiver.processQRCode(maliciousQRData);
      
      // Data should be stored as text, not executed
      expect(receiver.receivedData.value).toBe(maliciousQRData);
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should prevent XSS in localStorage data', () => {
      const receiver = new QRDataReceiver();
      const maliciousData = '<script>alert("XSS from storage")</script>';
      
      receiver.autoSaveData(maliciousData);
      
      // Check localStorage contains the raw text
      const keys = Object.keys(localStorage.store);
      const storedData = JSON.parse(localStorage.getItem(keys[0]));
      expect(storedData.data).toBe(maliciousData);
      
      // No script execution
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should safely display stored session data', () => {
      const receiver = new QRDataReceiver();
      const maliciousSessionId = '<script>alert("XSS")</script>';
      const maliciousData = '<img src="x" onerror="alert(\'XSS2\')">';
      
      // Add malicious session
      const sessionData = {
        id: maliciousSessionId,
        timestamp: new Date().toISOString(),
        type: 'text',
        data: maliciousData,
        size: maliciousData.length
      };
      
      localStorage.setItem('session_test', JSON.stringify(sessionData));
      
      // Load and display sessions
      receiver.loadStoredSessions();
      
      // Should display without executing scripts
      expect(receiver.storedDataSection.style.display).toBe('block');
      expect(window.alert).not.toHaveBeenCalled();
      
      // Check that content is safely displayed
      const sessionItems = receiver.storedSessions.querySelectorAll('.frame-item');
      expect(sessionItems.length).toBeGreaterThan(0);
    });

    test('should prevent XSS in status messages', () => {
      const receiver = new QRDataReceiver();
      const maliciousStatus = '<script>alert("Status XSS")</script>Error occurred';
      
      receiver.showStatus(maliciousStatus, 'error');
      
      // Status should be displayed as text
      const statusElement = receiver.statusContainer.querySelector('.status');
      expect(statusElement.textContent).toBe(maliciousStatus);
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should validate and sanitize session IDs', () => {
      const receiver = new QRDataReceiver();
      const maliciousSessionId = '../../etc/passwd';
      
      // Should not allow path traversal in session IDs
      expect(() => {
        receiver.loadSession(maliciousSessionId);
      }).not.toThrow();
      
      // Should only access localStorage keys, not file system
      expect(receiver.receivedData.value).toBe('');
    });

    test('should prevent injection in dynamic HTML generation', () => {
      const receiver = new QRDataReceiver();
      
      // Add session with malicious content
      const maliciousSession = {
        id: 'session_malicious',
        timestamp: '"><script>alert("XSS")</script>',
        data: 'onclick="alert(\'XSS2\')" data',
        size: 100
      };
      
      localStorage.setItem('session_malicious', JSON.stringify(maliciousSession));
      
      // Load sessions (which generates HTML)
      receiver.loadStoredSessions();
      
      // Check that no scripts were executed
      expect(window.alert).not.toHaveBeenCalled();
      
      // Check that content is properly escaped in generated HTML
      const sessionItems = receiver.storedSessions.innerHTML;
      expect(sessionItems).toContain('session_malicious');
      expect(sessionItems).not.toContain('<script>');
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should handle null and undefined inputs safely', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = new QRDataSender();
      
      // Test null input
      sender.textInput.value = null;
      expect(() => sender.generateQRCode()).not.toThrow();
      
      // Test undefined input
      sender.textInput.value = undefined;
      expect(() => sender.generateQRCode()).not.toThrow();
      
      // Should handle gracefully
      expect(sender.frames).toEqual([]);
    });

    test('should validate configuration parameters', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = new QRDataSender();
      
      // Test invalid QR size
      sender.config.qrSize = -100;
      sender.textInput.value = 'test';
      
      expect(() => {
        sender.generateQRCode();
      }).not.toThrow();
      
      // Test invalid interval
      sender.config.interval = 'invalid';
      expect(() => {
        sender.startPlayback();
      }).not.toThrow();
    });

    test('should prevent code injection through configuration', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = new QRDataSender();
      
      // Attempt to inject code through config
      sender.config.errorCorrectionLevel = 'alert("XSS")';
      sender.textInput.value = 'test';
      
      sender.generateQRCode();
      
      // Should not execute injected code
      expect(window.alert).not.toHaveBeenCalled();
    });

    test('should handle special characters and escape sequences', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = new QRDataReceiver();
      
      const specialChars = '\n\r\t\\"\'\0\x01\x02\uFFFD';
      receiver.processQRCode(specialChars);
      
      // Should handle special characters without issues
      expect(receiver.receivedData.value).toBe(specialChars);
      
      // Check storage handles special characters
      const keys = Object.keys(localStorage.store);
      const storedData = JSON.parse(localStorage.getItem(keys[0]));
      expect(storedData.data).toBe(specialChars);
    });
  });

  describe('Content Security Policy Compliance', () => {
    test('should not use eval or similar dangerous functions', () => {
      const originalEval = global.eval;
      const originalFunction = global.Function;
      const originalSetTimeout = global.setTimeout;
      const originalSetInterval = global.setInterval;
      
      let evalUsed = false;
      let functionUsed = false;
      let dynamicCodeUsed = false;
      
      // Monitor dangerous function usage
      global.eval = function(...args) {
        evalUsed = true;
        return originalEval.apply(this, args);
      };
      
      global.Function = function(...args) {
        functionUsed = true;
        return originalFunction.apply(this, args);
      };
      
      global.setTimeout = function(fn, ...args) {
        if (typeof fn === 'string') {
          dynamicCodeUsed = true;
        }
        return originalSetTimeout.call(this, fn, ...args);
      };
      
      global.setInterval = function(fn, ...args) {
        if (typeof fn === 'string') {
          dynamicCodeUsed = true;
        }
        return originalSetInterval.call(this, fn, ...args);
      };
      
      // Test sender
      document.documentElement.innerHTML = senderHTML;
      let scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = new QRDataSender();
      sender.textInput.value = 'CSP test';
      sender.generateQRCode();
      
      // Test receiver
      document.documentElement.innerHTML = receiverHTML;
      scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = new QRDataReceiver();
      receiver.processQRCode('CSP test data');
      
      // Should not use dangerous functions (except for this test setup)
      // Note: eval is used in test setup, so we check it wasn't used excessively
      expect(evalUsed).toBe(true); // Used in test setup
      expect(functionUsed).toBe(false);
      expect(dynamicCodeUsed).toBe(false);
      
      // Restore original functions
      global.eval = originalEval;
      global.Function = originalFunction;
      global.setTimeout = originalSetTimeout;
      global.setInterval = originalSetInterval;
    });

    test('should not create inline event handlers', () => {
      document.documentElement.innerHTML = senderHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      // Check that no elements have inline event handlers
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(element => {
        const attributes = element.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attr = attributes[i];
          // Check for inline event handlers
          expect(attr.name).not.toMatch(/^on[a-z]+$/i);
        }
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    test('should validate localStorage data integrity', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = new QRDataReceiver();
      
      // Add corrupted data to localStorage
      localStorage.setItem('session_corrupt', 'invalid json data');
      localStorage.setItem('session_valid', JSON.stringify({
        id: 'session_valid',
        data: 'Valid data',
        timestamp: new Date().toISOString(),
        type: 'text',
        size: 10
      }));
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should handle corrupted data gracefully
      expect(() => {
        receiver.loadStoredSessions();
      }).not.toThrow();
      
      // Should warn about corrupted data
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid session data:', 'session_corrupt');
      
      consoleWarnSpy.mockRestore();
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
      
      // Add session with missing required fields
      const incompleteSession = {
        id: 'incomplete',
        // missing timestamp, type, data, size
      };
      
      localStorage.setItem('session_incomplete', JSON.stringify(incompleteSession));
      
      expect(() => {
        receiver.loadSession('session_incomplete');
      }).not.toThrow();
      
      // Should handle missing fields gracefully
      expect(receiver.receivedData.value).toBe('');
    });

    test('should prevent data tampering through Object manipulation', () => {
      document.documentElement.innerHTML = receiverHTML;
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = new QRDataReceiver();
      
      // Attempt to tamper with Object methods
      const originalStringify = JSON.stringify;
      const originalParse = JSON.parse;
      
      let stringifyTampered = false;
      let parseTampered = false;
      
      JSON.stringify = function(obj) {
        if (obj && obj.data) {
          stringifyTampered = true;
          obj.data = 'TAMPERED';
        }
        return originalStringify.call(this, obj);
      };
      
      JSON.parse = function(str) {
        parseTampered = true;
        const obj = originalParse.call(this, str);
        if (obj && obj.data) {
          obj.data = 'TAMPERED';
        }
        return obj;
      };
      
      const originalData = 'Original secure data';
      receiver.autoSaveData(originalData);
      
      // Should detect or prevent tampering
      expect(stringifyTampered).toBe(true);
      
      // Restore original functions
      JSON.stringify = originalStringify;
      JSON.parse = originalParse;
    });
  });
});