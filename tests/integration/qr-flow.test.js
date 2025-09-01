// Integration tests for QR encoding/decoding flow between sender and receiver

const fs = require('fs');
const path = require('path');

// Import mocks
require('../mocks/qr-libraries');
require('../mocks/camera-api');
require('../mocks/storage-api');

describe('QR Data Transfer Integration', () => {
  let senderHTML, receiverHTML;
  let QRDataSender, QRDataReceiver;
  let mockJsQR;

  beforeAll(() => {
    // Load HTML files
    const senderPath = path.join(__dirname, '../../sender.html');
    const receiverPath = path.join(__dirname, '../../receiver.html');
    senderHTML = fs.readFileSync(senderPath, 'utf8');
    receiverHTML = fs.readFileSync(receiverPath, 'utf8');
  });

  beforeEach(() => {
    // Clear all previous mocks and DOM
    document.documentElement.innerHTML = '';
    jest.clearAllMocks();
    
    // Reset global variables
    if (global.qrSender) delete global.qrSender;
    if (global.qrReceiver) delete global.qrReceiver;
  });

  describe('Complete Data Transfer Flow', () => {
    test('should successfully transfer text data from sender to receiver', async () => {
      // ARRANGE: Set up sender
      document.documentElement.innerHTML = senderHTML;
      
      // Execute sender scripts
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      // Trigger DOMContentLoaded for sender
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      expect(sender).toBeDefined();
      
      // Set test data
      const testData = 'Hello from sender to receiver!';
      sender.textInput.value = testData;
      
      // ACT: Generate QR code
      sender.generateQRCode();
      
      // ASSERT: QR code generated
      expect(sender.frames).toEqual([testData]);
      expect(global.QRCode).toHaveBeenCalled();
      
      // Simulate QR code canvas creation
      const qrCanvas = document.querySelector('canvas');
      expect(qrCanvas).toBeTruthy();
      expect(qrCanvas.width).toBe(256);
      expect(qrCanvas.height).toBe(256);
      
      // Get the canvas image data (simulating camera capture)
      const ctx = qrCanvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
      
      // ARRANGE: Set up receiver
      document.documentElement.innerHTML = receiverHTML;
      
      // Execute receiver scripts
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      // Set up jsQR to return our test data
      global.jsQR._setTestData(testData);
      
      // Trigger DOMContentLoaded for receiver
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      expect(receiver).toBeDefined();
      
      // ACT: Process the QR code data
      receiver.processQRCode(testData);
      
      // ASSERT: Data received and processed
      expect(receiver.receivedData.value).toBe(testData);
      expect(receiver.resultsSection.style.display).toBe('block');
      expect(receiver.progressFill.style.width).toBe('100%');
      expect(receiver.progressText.textContent).toBe('传输完成！');
      expect(receiver.scanCount).toBe(1);
      
      // Check localStorage storage
      const storageKeys = Object.keys(localStorage.store);
      expect(storageKeys.length).toBe(1);
      expect(storageKeys[0]).toMatch(/^session_\d+$/);
      
      const storedData = JSON.parse(localStorage.getItem(storageKeys[0]));
      expect(storedData.data).toBe(testData);
      expect(storedData.type).toBe('text');
      expect(storedData.size).toBe(testData.length);
    });

    test('should handle large text data transfer', async () => {
      // ARRANGE: Set up sender with large data
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      const largeData = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(200); // ~10KB
      sender.textInput.value = largeData;
      
      // ACT & ASSERT: Should generate QR code even with large data
      expect(() => {
        sender.generateQRCode();
      }).not.toThrow();
      
      expect(sender.frames).toEqual([largeData]);
      
      // ARRANGE: Set up receiver
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      global.jsQR._setTestData(largeData);
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // ACT: Process large data
      receiver.processQRCode(largeData);
      
      // ASSERT: Large data handled correctly
      expect(receiver.receivedData.value).toBe(largeData);
      expect(receiver.receivedData.value.length).toBe(largeData.length);
    });

    test('should handle unicode and special characters', async () => {
      // ARRANGE
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      const unicodeData = '你好世界 🌍 Héllo Wörld! ñiño €100 ‰ ∑ ∞ ≈ ≠ ≤ ≥';
      sender.textInput.value = unicodeData;
      
      // ACT
      sender.generateQRCode();
      
      // ASSERT
      expect(sender.frames).toEqual([unicodeData]);
      
      // ARRANGE: Receiver
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      global.jsQR._setTestData(unicodeData);
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // ACT
      receiver.processQRCode(unicodeData);
      
      // ASSERT
      expect(receiver.receivedData.value).toBe(unicodeData);
      
      // Verify storage preserves unicode
      const storageKeys = Object.keys(localStorage.store);
      const storedData = JSON.parse(localStorage.getItem(storageKeys[0]));
      expect(storedData.data).toBe(unicodeData);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle QR generation errors gracefully in full flow', async () => {
      // ARRANGE: Set up sender
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      sender.textInput.value = 'test data';
      
      // Mock QRCode to throw error
      global.QRCode.mockImplementation(() => {
        throw new Error('QR generation failed');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ACT
      sender.generateQRCode();
      
      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'QR Generation Error:', 
        expect.any(Error)
      );
      expect(sender.frames).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle QR scanning errors in receiver', async () => {
      // ARRANGE: Set up receiver
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Mock autoSaveData to throw error
      jest.spyOn(receiver, 'autoSaveData').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ACT
      receiver.processQRCode('test data');
      
      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'QR processing error:', 
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle storage quota exceeded during transfer', async () => {
      // ARRANGE: Set up receiver with limited storage quota
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      // Set up localStorage with small quota
      localStorage._setQuota(100); // Very small quota
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      const largeData = 'x'.repeat(1000); // Exceeds quota
      
      // ACT & ASSERT
      expect(() => {
        receiver.autoSaveData(largeData);
      }).toThrow('QuotaExceededError');
    });
  });

  describe('Camera Integration', () => {
    test('should integrate camera with QR scanning', async () => {
      // ARRANGE: Set up receiver
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Mock successful camera access
      const mockStream = new MockMediaStream();
      navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      
      // ACT: Start camera
      await receiver.startCamera();
      
      // ASSERT: Camera started
      expect(receiver.stream).toBe(mockStream);
      expect(receiver.video.srcObject).toBe(mockStream);
      expect(receiver.startCameraBtn.disabled).toBe(true);
      expect(receiver.stopCameraBtn.disabled).toBe(false);
      
      // Simulate video ready and QR detection
      receiver.video._simulateVideoReady();
      
      const testData = 'Camera detected QR data';
      global.jsQR._setTestData(testData);
      global.jsQR.mockReturnValue({ data: testData });
      
      // ACT: Scan frame
      receiver.scanFrame();
      
      // ASSERT: QR data processed
      expect(global.jsQR).toHaveBeenCalled();
    });

    test('should handle camera permission denied', async () => {
      // ARRANGE
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Mock camera permission denied
      const { CameraErrors } = require('../mocks/camera-api');
      navigator.mediaDevices.getUserMedia.mockRejectedValue(
        new CameraErrors.NotAllowedError('Permission denied')
      );
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ACT
      await receiver.startCamera();
      
      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Camera access error:', 
        expect.any(Error)
      );
      expect(receiver.stream).toBe(null);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Storage Integration', () => {
    test('should integrate storage operations with QR data flow', async () => {
      // ARRANGE
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Pre-populate storage with test sessions
      const existingData = [
        { id: 'session_1', data: 'Old data 1', timestamp: '2024-01-01T10:00:00Z', type: 'text', size: 10 },
        { id: 'manual_1', data: 'Manual data', timestamp: '2024-01-02T10:00:00Z', type: 'text', size: 11, manual: true }
      ];
      
      existingData.forEach(session => {
        localStorage.setItem(session.id, JSON.stringify(session));
      });
      
      // ACT: Load stored sessions
      receiver.loadStoredSessions();
      
      // ASSERT: Sessions loaded
      expect(receiver.storedDataSection.style.display).toBe('block');
      
      // ACT: Process new QR data
      const newData = 'New QR data from integration test';
      receiver.processQRCode(newData);
      
      // ASSERT: New data added to storage
      const allKeys = Object.keys(localStorage.store);
      expect(allKeys.length).toBe(3); // 2 existing + 1 new
      
      const newSessionKey = allKeys.find(key => key.startsWith('session_') && key !== 'session_1');
      expect(newSessionKey).toBeDefined();
      
      const newSession = JSON.parse(localStorage.getItem(newSessionKey));
      expect(newSession.data).toBe(newData);
      
      // ACT: Load specific session
      receiver.loadSession('session_1');
      
      // ASSERT: Session loaded into UI
      expect(receiver.receivedData.value).toBe('Old data 1');
      expect(receiver.resultsSection.style.display).toBe('block');
      
      // ACT: Delete session
      global.confirm.mockReturnValue(true);
      receiver.deleteSession('manual_1');
      
      // ASSERT: Session deleted
      expect(localStorage.getItem('manual_1')).toBe(null);
      expect(Object.keys(localStorage.store).length).toBe(2);
    });

    test('should handle storage errors during QR processing', async () => {
      // ARRANGE
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ACT
      receiver.processQRCode('test data');
      
      // ASSERT: Error handled gracefully
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'QR processing error:', 
        expect.any(Error)
      );
      
      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI State Integration', () => {
    test('should maintain consistent UI state during complete flow', async () => {
      // ARRANGE: Sender
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      sender.textInput.value = 'UI state test';
      
      // ACT: Generate QR
      sender.generateQRCode();
      
      // ASSERT: Sender UI state
      expect(sender.playBtn.disabled).toBe(false);
      expect(sender.pauseBtn.disabled).toBe(false);
      expect(sender.stopBtn.disabled).toBe(false);
      
      // ACT: Start playback
      sender.startPlayback();
      
      // ASSERT: Playback UI state
      expect(sender.isPlaying).toBe(true);
      expect(sender.playBtn.disabled).toBe(true);
      expect(sender.pauseBtn.disabled).toBe(false);
      expect(sender.progressSection.style.display).toBe('block');
      
      // ACT: Clear all
      sender.clearAll();
      
      // ASSERT: Reset UI state
      expect(sender.frames).toEqual([]);
      expect(sender.textInput.value).toBe('');
      expect(sender.playBtn.disabled).toBe(true);
      expect(sender.pauseBtn.disabled).toBe(true);
      expect(sender.stopBtn.disabled).toBe(true);
      
      // ARRANGE: Receiver
      document.documentElement.innerHTML = receiverHTML;
      
      const receiverScripts = document.querySelectorAll('script');
      receiverScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const receiver = window.qrReceiver;
      
      // Initial state
      expect(receiver.resultsSection.style.display).toBe('none');
      expect(receiver.progressFill.style.width).toBe('');
      
      // ACT: Process QR data
      receiver.processQRCode('UI state test');
      
      // ASSERT: Receiver UI state after processing
      expect(receiver.resultsSection.style.display).toBe('block');
      expect(receiver.progressFill.style.width).toBe('100%');
      expect(receiver.progressText.textContent).toBe('传输完成！');
      
      // ACT: Reset session
      receiver.resetSession();
      
      // ASSERT: Reset UI state
      expect(receiver.receivedData.value).toBe('');
      expect(receiver.resultsSection.style.display).toBe('none');
      expect(receiver.progressFill.style.width).toBe('0%');
      expect(receiver.progressText.textContent).toBe('等待二维码...');
      expect(receiver.scanCount).toBe(0);
    });
  });

  describe('Configuration Integration', () => {
    test('should respect QR size and error correction settings', async () => {
      // ARRANGE
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      sender.textInput.value = 'Config test';
      
      // ACT: Change QR size
      sender.config.qrSize = 512;
      sender.qrSizeDisplay.textContent = '512px';
      
      // Generate QR with new size
      sender.generateQRCode();
      
      // ASSERT: QR generated with correct size
      expect(global.QRCode).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          width: 512,
          height: 512
        })
      );
      
      const canvas = document.querySelector('canvas');
      expect(canvas.width).toBe(512);
      expect(canvas.height).toBe(512);
    });

    test('should handle interval changes for playback', async () => {
      // ARRANGE
      document.documentElement.innerHTML = senderHTML;
      
      const senderScripts = document.querySelectorAll('script');
      senderScripts.forEach(script => {
        if (script.textContent && !script.src) {
          eval(script.textContent);
        }
      });
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      const sender = window.qrSender;
      sender.textInput.value = 'Interval test';
      
      // ACT: Change interval
      sender.config.interval = 3000;
      sender.intervalDisplay.textContent = '3000ms';
      
      // Generate and verify
      sender.generateQRCode();
      expect(sender.config.interval).toBe(3000);
      
      // This would affect future multi-frame playback in Phase 2
      sender.startPlayback();
      expect(sender.isPlaying).toBe(true);
    });
  });
});