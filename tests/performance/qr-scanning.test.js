// Performance tests for QR code scanning and processing

const fs = require('fs');
const path = require('path');

describe('QR Scanning Performance', () => {
  let receiverHTML;
  let QRDataReceiver;

  beforeAll(() => {
    const receiverPath = path.join(__dirname, '../../receiver.html');
    receiverHTML = fs.readFileSync(receiverPath, 'utf8');
  });

  beforeEach(() => {
    // Set up DOM
    document.documentElement.innerHTML = receiverHTML;
    
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent && !script.src) {
        eval(script.textContent);
      }
    });
    
    // Mock jsQR for performance testing
    global.jsQR = jest.fn();
    
    document.dispatchEvent(new Event('DOMContentLoaded'));
    QRDataReceiver = window.qrReceiver.constructor;
  });

  describe('QR Code Processing Performance', () => {
    test('should process QR codes efficiently', () => {
      const receiver = new QRDataReceiver();
      const testData = 'Performance test data';
      
      const startTime = performance.now();
      receiver.processQRCode(testData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(receiver.receivedData.value).toBe(testData);
      expect(duration).toBeLessThan(50); // Should be very fast
      
      console.log(`QR Processing: ${duration.toFixed(2)}ms`);
    });

    test('should handle large QR data efficiently', () => {
      const receiver = new QRDataReceiver();
      const largeData = 'A'.repeat(5000);
      
      const startTime = performance.now();
      receiver.processQRCode(largeData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(receiver.receivedData.value).toBe(largeData);
      expect(duration).toBeLessThan(100);
      
      console.log(`Large QR Processing: ${duration.toFixed(2)}ms`);
    });

    test('should handle rapid successive QR scans', () => {
      const receiver = new QRDataReceiver();
      const iterations = 20;
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const testData = `Rapid scan ${i}`;
        
        const startTime = performance.now();
        receiver.processQRCode(testData);
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
        
        // Reset lastScannedData to allow processing
        receiver.lastScannedData = null;
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(avgDuration).toBeLessThan(100);
      expect(maxDuration).toBeLessThan(200);
      
      console.log(`Rapid QR Scanning - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });

    test('should efficiently reject duplicate QR data', () => {
      const receiver = new QRDataReceiver();
      const testData = 'Duplicate test data';
      
      // First scan
      receiver.processQRCode(testData);
      expect(receiver.scanCount).toBe(1);
      
      // Measure duplicate rejection performance
      const startTime = performance.now();
      receiver.processQRCode(testData); // Should be rejected
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(receiver.scanCount).toBe(1); // Should not increment
      expect(duration).toBeLessThan(10); // Should be extremely fast
      
      console.log(`Duplicate Rejection: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Video Frame Scanning Performance', () => {
    test('should scan video frames efficiently', () => {
      const receiver = new QRDataReceiver();
      receiver.video.videoWidth = 640;
      receiver.video.videoHeight = 480;
      
      // Mock canvas operations
      let canvasOperations = 0;
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type) {
        const context = originalGetContext.call(this, type);
        if (type === '2d') {
          const originalDrawImage = context.drawImage;
          const originalGetImageData = context.getImageData;
          
          context.drawImage = function(...args) {
            canvasOperations++;
            return originalDrawImage.apply(this, args);
          };
          
          context.getImageData = function(...args) {
            canvasOperations++;
            return originalGetImageData.apply(this, args);
          };
        }
        return context;
      };
      
      // Mock jsQR to return data
      global.jsQR.mockReturnValue({ data: 'Scanned data' });
      
      const startTime = performance.now();
      receiver.scanFrame();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(canvasOperations).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
      
      // Restore
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      
      console.log(`Video Frame Scan: ${duration.toFixed(2)}ms, Canvas ops: ${canvasOperations}`);
    });

    test('should handle high-frequency scanning', () => {
      const receiver = new QRDataReceiver();
      receiver.video.videoWidth = 1280;
      receiver.video.videoHeight = 720;
      
      const scanFrequency = 10; // 10 FPS
      const scanInterval = 1000 / scanFrequency;
      const iterations = 30;
      
      global.jsQR.mockReturnValue(null); // No QR detected
      
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        receiver.scanFrame();
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      // Should be faster than scan interval to maintain real-time performance
      expect(avgDuration).toBeLessThan(scanInterval / 2);
      expect(maxDuration).toBeLessThan(scanInterval);
      
      console.log(`High-frequency Scanning - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });

    test('should handle different video resolutions efficiently', () => {
      const receiver = new QRDataReceiver();
      
      const resolutions = [
        { width: 320, height: 240, name: '320x240' },
        { width: 640, height: 480, name: '640x480' },
        { width: 1280, height: 720, name: '720p' },
        { width: 1920, height: 1080, name: '1080p' }
      ];
      
      global.jsQR.mockReturnValue(null);
      
      resolutions.forEach(({ width, height, name }) => {
        receiver.video.videoWidth = width;
        receiver.video.videoHeight = height;
        
        const startTime = performance.now();
        receiver.scanFrame();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        // Higher resolutions should still be reasonably fast
        const pixelCount = width * height;
        const expectedMaxDuration = Math.max(50, pixelCount / 10000); // Rough heuristic
        
        expect(duration).toBeLessThan(expectedMaxDuration);
        
        console.log(`Resolution ${name}: ${duration.toFixed(2)}ms`);
      });
    });
  });

  describe('Storage Performance', () => {
    test('should save data to localStorage efficiently', () => {
      const receiver = new QRDataReceiver();
      const testData = 'Storage performance test';
      
      const startTime = performance.now();
      receiver.autoSaveData(testData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
      
      // Verify data was saved
      const keys = Object.keys(localStorage.store);
      expect(keys.length).toBe(1);
      
      console.log(`Storage Save: ${duration.toFixed(2)}ms`);
    });

    test('should load stored sessions efficiently', () => {
      const receiver = new QRDataReceiver();
      
      // Create multiple test sessions
      const sessionCount = 20;
      for (let i = 0; i < sessionCount; i++) {
        const sessionData = {
          id: `session_${i}`,
          timestamp: new Date().toISOString(),
          type: 'text',
          data: `Test data ${i}`,
          size: 10 + i
        };
        localStorage.setItem(`session_${i}`, JSON.stringify(sessionData));
      }
      
      const startTime = performance.now();
      receiver.loadStoredSessions();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(sessionCount * 5); // 5ms per session max
      
      console.log(`Load ${sessionCount} Sessions: ${duration.toFixed(2)}ms`);
    });

    test('should handle storage operations under load', () => {
      const receiver = new QRDataReceiver();
      const operationCount = 50;
      const durations = [];
      
      for (let i = 0; i < operationCount; i++) {
        const testData = `Load test data ${i}`;
        
        const startTime = performance.now();
        
        // Mix of save and load operations
        if (i % 2 === 0) {
          receiver.autoSaveData(testData);
        } else {
          receiver.loadStoredSessions();
        }
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(avgDuration).toBeLessThan(20);
      expect(maxDuration).toBeLessThan(100);
      
      console.log(`Storage Under Load - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });

    test('should efficiently clear large amounts of storage', () => {
      const receiver = new QRDataReceiver();
      
      // Create many sessions
      const sessionCount = 100;
      for (let i = 0; i < sessionCount; i++) {
        localStorage.setItem(`session_${i}`, JSON.stringify({ id: `session_${i}` }));
        localStorage.setItem(`manual_${i}`, JSON.stringify({ id: `manual_${i}` }));
      }
      
      // Add some non-QR data that should remain
      localStorage.setItem('other_data', 'should remain');
      
      // Mock confirm
      global.confirm.mockReturnValue(true);
      
      const startTime = performance.now();
      receiver.clearAllStorage();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      // Should complete in reasonable time even with many items
      expect(duration).toBeLessThan(sessionCount); // 1ms per item max
      
      // Verify correct items were cleared
      expect(localStorage.getItem('other_data')).toBe('should remain');
      expect(localStorage.getItem('session_0')).toBe(null);
      
      console.log(`Clear ${sessionCount * 2} Sessions: ${duration.toFixed(2)}ms`);
    });
  });

  describe('UI Update Performance', () => {
    test('should update progress indicators efficiently', () => {
      const receiver = new QRDataReceiver();
      const iterations = 100;
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Simulate progress updates (would be part of multi-frame processing in Phase 2)
        receiver.progressFill.style.width = `${(i / iterations) * 100}%`;
        receiver.progressText.textContent = `Frame ${i} / ${iterations}`;
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(avgDuration).toBeLessThan(5);
      expect(maxDuration).toBeLessThan(20);
      
      console.log(`UI Updates - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });

    test('should handle status message updates efficiently', () => {
      const receiver = new QRDataReceiver();
      const messageCount = 50;
      const durations = [];
      
      for (let i = 0; i < messageCount; i++) {
        const message = `Status message ${i}`;
        const type = ['info', 'warning', 'error'][i % 3];
        
        const startTime = performance.now();
        receiver.showStatus(message, type);
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      expect(avgDuration).toBeLessThan(10);
      
      console.log(`Status Updates - Avg: ${avgDuration.toFixed(2)}ms`);
    });
  });

  describe('Memory Efficiency', () => {
    test('should not accumulate excessive memory during scanning', () => {
      const receiver = new QRDataReceiver();
      receiver.video.videoWidth = 640;
      receiver.video.videoHeight = 480;
      
      // Track canvas creation
      let canvasCount = 0;
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        if (tagName === 'canvas') {
          canvasCount++;
        }
        return originalCreateElement.call(this, tagName);
      };
      
      global.jsQR.mockReturnValue(null);
      
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        receiver.scanFrame();
      }
      
      // Should create minimal canvases (ideally reuse)
      expect(canvasCount).toBeLessThanOrEqual(iterations);
      
      // Restore
      document.createElement = originalCreateElement;
      
      console.log(`Memory Test: ${canvasCount} canvases created for ${iterations} scans`);
    });

    test('should handle large data without memory leaks', () => {
      const receiver = new QRDataReceiver();
      const largeDataSizes = [1000, 2000, 5000, 8000, 10000];
      
      largeDataSizes.forEach(size => {
        const largeData = 'X'.repeat(size);
        
        // Process multiple times to check for accumulation
        for (let i = 0; i < 5; i++) {
          receiver.processQRCode(largeData);
          receiver.lastScannedData = null; // Allow reprocessing
        }
        
        // Check that receiver data contains the correct value
        expect(receiver.receivedData.value).toBe(largeData);
      });
      
      // Check storage doesn't accumulate excessively
      const storageKeys = Object.keys(localStorage.store);
      expect(storageKeys.length).toBe(largeDataSizes.length);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent QR processing efficiently', (done) => {
      const receiver = new QRDataReceiver();
      const concurrentOperations = 10;
      let completedOperations = 0;
      const durations = [];
      
      const processData = (index) => {
        const testData = `Concurrent data ${index}`;
        
        const startTime = performance.now();
        receiver.processQRCode(testData);
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
        completedOperations++;
        
        receiver.lastScannedData = null; // Allow next operation
        
        if (completedOperations === concurrentOperations) {
          const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
          
          expect(avgDuration).toBeLessThan(100);
          
          console.log(`Concurrent QR Processing: ${avgDuration.toFixed(2)}ms average`);
          done();
        }
      };
      
      for (let i = 0; i < concurrentOperations; i++) {
        setTimeout(() => processData(i), i * 10);
      }
    });

    test('should maintain scanning performance during UI updates', () => {
      const receiver = new QRDataReceiver();
      receiver.video.videoWidth = 640;
      receiver.video.videoHeight = 480;
      
      global.jsQR.mockReturnValue(null);
      
      const scanIterations = 20;
      const durations = [];
      
      for (let i = 0; i < scanIterations; i++) {
        // Simulate concurrent UI update
        receiver.showStatus(`Scanning... ${i}`, 'info');
        receiver.progressFill.style.width = `${(i / scanIterations) * 100}%`;
        
        const startTime = performance.now();
        receiver.scanFrame();
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      // Should maintain good performance despite UI updates
      expect(avgDuration).toBeLessThan(100);
      expect(maxDuration).toBeLessThan(200);
      
      console.log(`Scanning with UI Updates - Avg: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });
  });
});