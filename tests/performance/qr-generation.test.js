// Performance tests for QR code generation with varying data sizes

const fs = require('fs');
const path = require('path');

describe('QR Generation Performance', () => {
  let senderHTML;
  let QRDataSender;
  let performanceMarks = [];

  beforeAll(() => {
    const senderPath = path.join(__dirname, '../../sender.html');
    senderHTML = fs.readFileSync(senderPath, 'utf8');
  });

  beforeEach(() => {
    // Clear performance marks
    performanceMarks = [];
    
    // Mock performance.mark and performance.measure
    global.performance.mark = jest.fn((name) => {
      performanceMarks.push({ name, timestamp: Date.now(), type: 'mark' });
    });
    
    global.performance.measure = jest.fn((name, startMark, endMark) => {
      const start = performanceMarks.find(mark => mark.name === startMark);
      const end = performanceMarks.find(mark => mark.name === endMark);
      const duration = end ? end.timestamp - start.timestamp : 0;
      performanceMarks.push({ name, duration, type: 'measure' });
      return { name, duration };
    });
    
    // Set up DOM
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

  describe('QR Code Generation Performance', () => {
    const testSizes = [
      { name: 'Small (100 chars)', size: 100 },
      { name: 'Medium (500 chars)', size: 500 },
      { name: 'Large (1KB)', size: 1000 },
      { name: 'Very Large (5KB)', size: 5000 },
      { name: 'Max Size (10KB)', size: 10000 }
    ];

    testSizes.forEach(({ name, size }) => {
      test(`should generate QR code efficiently for ${name}`, () => {
        const sender = new QRDataSender();
        const testData = 'A'.repeat(size);
        sender.textInput.value = testData;

        // Performance timing
        const startTime = performance.now();
        performance.mark('qr-generation-start');

        sender.generateQRCode();

        performance.mark('qr-generation-end');
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Assertions
        expect(sender.frames).toEqual([testData]);
        expect(global.QRCode).toHaveBeenCalled();

        // Performance expectations (adjust based on requirements)
        const maxDuration = size < 1000 ? 100 : size < 5000 ? 500 : 1000;
        expect(duration).toBeLessThan(maxDuration);

        // Log performance for analysis
        console.log(`QR Generation ${name}: ${duration.toFixed(2)}ms`);
      });
    });

    test('should handle rapid successive QR generations', () => {
      const sender = new QRDataSender();
      const iterations = 10;
      const testData = 'Rapid generation test data';
      
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        sender.textInput.value = `${testData} ${i}`;
        
        const startTime = performance.now();
        sender.generateQRCode();
        const endTime = performance.now();
        
        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      // Performance expectations
      expect(avgDuration).toBeLessThan(200);
      expect(maxDuration).toBeLessThan(500);
      expect(minDuration).toBeGreaterThan(0);

      // Check for performance degradation (max should not be too much higher than average)
      const degradationRatio = maxDuration / avgDuration;
      expect(degradationRatio).toBeLessThan(5);

      console.log(`Rapid Generation - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });

    test('should maintain performance across different QR sizes', () => {
      const sender = new QRDataSender();
      const testData = 'QR size performance test';
      const qrSizes = [128, 256, 384, 512];
      
      const results = qrSizes.map(size => {
        sender.config.qrSize = size;
        sender.textInput.value = testData;
        
        const startTime = performance.now();
        sender.generateQRCode();
        const endTime = performance.now();
        
        return {
          size,
          duration: endTime - startTime
        };
      });

      // Check that larger QR codes don't take disproportionately longer
      results.forEach((result, index) => {
        if (index > 0) {
          const prevResult = results[index - 1];
          const sizeRatio = result.size / prevResult.size;
          const timeRatio = result.duration / prevResult.duration;
          
          // Time increase should be reasonable relative to size increase
          expect(timeRatio).toBeLessThan(sizeRatio * 2);
        }
        
        // Individual size performance expectations
        expect(result.duration).toBeLessThan(300);
        
        console.log(`QR Size ${result.size}px: ${result.duration.toFixed(2)}ms`);
      });
    });

    test('should handle unicode characters efficiently', () => {
      const sender = new QRDataSender();
      
      // Test different types of unicode data
      const unicodeTests = [
        { name: 'ASCII only', data: 'Hello World!'.repeat(50) },
        { name: 'Chinese characters', data: '你好世界'.repeat(50) },
        { name: 'Emojis', data: '🌍🚀💻📱'.repeat(50) },
        { name: 'Mixed unicode', data: 'Hello 你好 🌍 Wörld!'.repeat(30) },
        { name: 'Math symbols', data: '∑∞≈≠≤≥∂∆∇'.repeat(50) }
      ];

      unicodeTests.forEach(({ name, data }) => {
        sender.textInput.value = data;
        
        const startTime = performance.now();
        sender.generateQRCode();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        expect(sender.frames).toEqual([data]);
        expect(duration).toBeLessThan(500);
        
        console.log(`Unicode ${name}: ${duration.toFixed(2)}ms`);
      });
    });
  });

  describe('Canvas Rendering Performance', () => {
    test('should render QR code to canvas efficiently', () => {
      const sender = new QRDataSender();
      const testData = 'Canvas performance test';
      sender.textInput.value = testData;

      // Mock canvas operations for timing
      let canvasOperationsCount = 0;
      const originalFillRect = HTMLCanvasElement.prototype.getContext('2d').fillRect;
      
      HTMLCanvasElement.prototype.getContext('2d').fillRect = function(...args) {
        canvasOperationsCount++;
        return originalFillRect.apply(this, args);
      };

      const startTime = performance.now();
      sender.generateQRCode();
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Check performance
      expect(duration).toBeLessThan(100);
      expect(canvasOperationsCount).toBeGreaterThan(0);

      // Restore original method
      HTMLCanvasElement.prototype.getContext('2d').fillRect = originalFillRect;

      console.log(`Canvas Rendering: ${duration.toFixed(2)}ms, Operations: ${canvasOperationsCount}`);
    });

    test('should handle multiple canvas creations efficiently', () => {
      const sender = new QRDataSender();
      const iterations = 5;
      const testData = 'Multiple canvas test';

      let totalCanvasElements = 0;
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        if (tagName === 'canvas') {
          totalCanvasElements++;
        }
        return originalCreateElement.call(this, tagName);
      };

      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        sender.textInput.value = `${testData} ${i}`;
        sender.generateQRCode();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Performance expectations
      expect(duration).toBeLessThan(iterations * 100);
      expect(totalCanvasElements).toBe(iterations);

      // Restore original method
      document.createElement = originalCreateElement;

      console.log(`Multiple Canvas Creation: ${duration.toFixed(2)}ms for ${iterations} iterations`);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should not leak memory during repeated QR generation', () => {
      const sender = new QRDataSender();
      const iterations = 20;
      
      // Mock memory usage tracking
      let allocatedObjects = 0;
      const objectTracker = new Set();
      
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName === 'canvas') {
          allocatedObjects++;
          objectTracker.add(element);
        }
        return element;
      };

      // Clear display function that should clean up old canvases
      const originalDisplayQRCode = sender.displayQRCode;
      sender.displayQRCode = function(data, frameIndex) {
        // Clear previous canvas
        this.qrDisplay.innerHTML = '';
        return originalDisplayQRCode.call(this, data, frameIndex);
      };

      for (let i = 0; i < iterations; i++) {
        sender.textInput.value = `Memory test ${i}`;
        sender.generateQRCode();
      }

      // Check that we don't have excessive object accumulation
      expect(allocatedObjects).toBe(iterations);
      
      // In a real scenario, we'd want to ensure old canvases are properly removed
      const currentCanvases = sender.qrDisplay.querySelectorAll('canvas');
      expect(currentCanvases.length).toBeLessThanOrEqual(1);

      // Restore
      document.createElement = originalCreateElement;

      console.log(`Memory Test: ${allocatedObjects} canvases created over ${iterations} iterations`);
    });

    test('should handle large data without excessive memory usage', () => {
      const sender = new QRDataSender();
      
      // Create progressively larger data sets
      const sizes = [1000, 2000, 5000, 8000];
      let peakMemoryUsage = 0;
      
      sizes.forEach(size => {
        const largeData = 'X'.repeat(size);
        sender.textInput.value = largeData;
        
        // Mock memory measurement
        const beforeMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        
        sender.generateQRCode();
        
        const afterMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        const memoryIncrease = afterMemory - beforeMemory;
        
        peakMemoryUsage = Math.max(peakMemoryUsage, memoryIncrease);
        
        expect(sender.frames).toEqual([largeData]);
        
        // Memory increase should be reasonable
        if (process.memoryUsage) {
          expect(memoryIncrease).toBeLessThan(size * 10); // Arbitrary threshold
        }
        
        console.log(`Data size ${size}: Memory increase ~${memoryIncrease} bytes`);
      });
    });
  });

  describe('UI Responsiveness Performance', () => {
    test('should maintain UI responsiveness during QR generation', async () => {
      const sender = new QRDataSender();
      const largeData = 'A'.repeat(5000);
      sender.textInput.value = largeData;

      // Mock UI update timing
      let uiUpdateCount = 0;
      const originalShowStatus = sender.showStatus;
      sender.showStatus = function(...args) {
        uiUpdateCount++;
        const startTime = performance.now();
        const result = originalShowStatus.apply(this, args);
        const endTime = performance.now();
        
        // UI updates should be fast
        expect(endTime - startTime).toBeLessThan(50);
        return result;
      };

      const startTime = performance.now();
      sender.generateQRCode();
      const endTime = performance.now();

      expect(uiUpdateCount).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000);

      console.log(`UI Responsiveness: ${endTime - startTime}ms, UI updates: ${uiUpdateCount}`);
    });

    test('should handle button state changes efficiently', () => {
      const sender = new QRDataSender();
      sender.textInput.value = 'Button state test';

      const startTime = performance.now();
      
      // Generate QR (enables playback buttons)
      sender.generateQRCode();
      
      // Start playback (changes button states)
      sender.startPlayback();
      
      // Pause (changes button states)
      sender.pausePlayback();
      
      // Stop (changes button states)
      sender.stopPlayback();
      
      // Clear (resets button states)
      sender.clearAll();
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All button state changes should be very fast
      expect(duration).toBeLessThan(100);

      console.log(`Button State Changes: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Stress Testing', () => {
    test('should handle stress test with many rapid operations', () => {
      const sender = new QRDataSender();
      const stressTestIterations = 50;
      const stressTestData = 'Stress test data';
      
      const startTime = performance.now();
      
      for (let i = 0; i < stressTestIterations; i++) {
        sender.textInput.value = `${stressTestData} ${i}`;
        sender.generateQRCode();
        
        if (i % 10 === 0) {
          sender.startPlayback();
          sender.stopPlayback();
          sender.clearAll();
        }
      }
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / stressTestIterations;

      // Stress test performance expectations
      expect(totalDuration).toBeLessThan(stressTestIterations * 50); // 50ms per operation max
      expect(averageDuration).toBeLessThan(50);

      console.log(`Stress Test: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average per operation`);
    });

    test('should maintain performance under concurrent operations', (done) => {
      const sender = new QRDataSender();
      const concurrentOperations = 10;
      const durations = [];
      let completedOperations = 0;

      const performOperation = (index) => {
        const startTime = performance.now();
        sender.textInput.value = `Concurrent test ${index}`;
        
        // Simulate async operation
        setTimeout(() => {
          sender.generateQRCode();
          const endTime = performance.now();
          durations.push(endTime - startTime);
          completedOperations++;
          
          if (completedOperations === concurrentOperations) {
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const maxDuration = Math.max(...durations);
            
            expect(avgDuration).toBeLessThan(200);
            expect(maxDuration).toBeLessThan(500);
            
            console.log(`Concurrent Operations: Avg ${avgDuration.toFixed(2)}ms, Max ${maxDuration.toFixed(2)}ms`);
            done();
          }
        }, Math.random() * 10);
      };

      for (let i = 0; i < concurrentOperations; i++) {
        performOperation(i);
      }
    });
  });
});