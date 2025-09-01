/**
 * Segmented QR Testing Implementation
 * 
 * Implements the three-layer testing strategy:
 * 1. Pure logic tests (no browser APIs)
 * 2. Integration tests (controlled mocks)
 * 3. E2E tests (real browser - separate file)
 */

const QRTestArchitecture = require('./qr-test-architecture');

describe('Segmented QR Testing - Layer 1: Pure Logic', () => {
  let pureEnv;
  let testDataFlow;
  
  beforeEach(() => {
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
    testDataFlow = QRTestArchitecture.createTestDataFlow();
  });
  
  describe('QR Generation Logic', () => {
    describe('Small Data (< 100 bytes)', () => {
      test('should generate single frame for very small text', () => {
        const input = 'Hi'; // 2 bytes
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(1);
        expect(result[0].frameNumber).toBe(1);
        expect(result[0].totalFrames).toBe(1);
        expect(result[0].data).toBe(input);
        expect(result[0].metadata).toBeDefined();
        expect(result[0].metadata.totalChunks).toBe(1);
        
        testDataFlow.storeGeneratedData('very-small-text-test', { frames: result });
      });
      
      test('should generate single frame for small text boundary', () => {
        const input = 'x'.repeat(99); // 99 bytes - boundary test
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(1);
        expect(result[0].frameNumber).toBe(1);
        expect(result[0].totalFrames).toBe(1);
        expect(result[0].data).toBe(input);
        expect(result[0].metadata.totalChunks).toBe(1);
        
        testDataFlow.storeGeneratedData('small-boundary-test', { frames: result });
      });
    });
    
    describe('Medium Data (100-1000 bytes)', () => {
      test('should generate single frame for 100 bytes exactly', () => {
        const input = 'x'.repeat(100); // Exactly 100 bytes
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(1);
        expect(result[0].data).toBe(input);
        expect(result[0].metadata.totalChunks).toBe(1);
        
        testDataFlow.storeGeneratedData('medium-start-test', { frames: result });
      });
      
      test('should generate single frame for medium text', () => {
        const input = 'x'.repeat(500); // 500 bytes - still single chunk
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(1);
        expect(result[0].data).toBe(input);
        expect(result[0].metadata.totalChunks).toBe(1);
        
        testDataFlow.storeGeneratedData('medium-text-test', { frames: result });
      });
      
      test('should handle 800 byte boundary (single chunk max)', () => {
        const input = 'x'.repeat(800); // Exactly at chunk boundary
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(1);
        expect(result[0].data).toBe(input);
        expect(result[0].metadata.totalChunks).toBe(1);
        
        testDataFlow.storeGeneratedData('chunk-boundary-test', { frames: result });
      });
      
      test('should generate multiple frames for 1000 bytes', () => {
        const input = 'x'.repeat(1000); // 1000 bytes - needs 2 chunks (800 + 200)
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(2);
        expect(result[0].data).toHaveLength(800);
        expect(result[1].data).toHaveLength(200);
        expect(result[0].metadata.totalChunks).toBe(2);
        
        const reconstructed = result.map(r => r.data).join('');
        expect(reconstructed).toBe(input);
        
        testDataFlow.storeGeneratedData('medium-end-test', { frames: result });
      });
    });
    
    describe('Large Data (> 1000 bytes)', () => {
      test('should generate multiple frames for large text', () => {
        const input = 'x'.repeat(2500); // Will need multiple 800-char chunks
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(4); // 2500 / 800 = 3.125, so 4 chunks
        expect(result[0].metadata.totalChunks).toBe(4);
        
        // Verify chunking
        const reconstructed = result.map(r => r.data).join('');
        expect(reconstructed).toBe(input);
        
        testDataFlow.storeGeneratedData('large-text-test', { frames: result });
      });
      
      test('should handle very large data efficiently', () => {
        const input = 'x'.repeat(5000); // Very large - 7 chunks
        const result = pureEnv.generateQRData(input);
        
        expect(result).toHaveLength(7); // 5000 / 800 = 6.25, so 7 chunks
        expect(result[0].metadata.totalChunks).toBe(7);
        
        // Verify each frame has correct metadata
        result.forEach((frame, idx) => {
          expect(frame.frameNumber).toBe(idx + 1);
          expect(frame.totalFrames).toBe(7);
          if (idx < 6) {
            expect(frame.data).toHaveLength(800);
          } else {
            expect(frame.data).toHaveLength(200); // Last chunk: 5000 - (6 * 800) = 200
          }
        });
        
        testDataFlow.storeGeneratedData('very-large-text-test', { frames: result });
      });
    });
    
    test('should handle unicode correctly', () => {
      const input = '你好世界 🌍 émojis ñiño';
      const result = pureEnv.generateQRData(input);
      
      expect(result[0].data).toBe(input);
      expect(result[0].metadata.encoding).toBe('utf-8');
      
      testDataFlow.storeGeneratedData('unicode-test', { frames: result });
    });
    
    test('should generate consistent checksums', () => {
      const input = 'Consistent data';
      const result1 = pureEnv.generateQRData(input);
      const result2 = pureEnv.generateQRData(input);
      
      expect(result1[0].metadata.checksum).toBe(result2[0].metadata.checksum);
    });
    
    test('should handle custom chunk sizes', () => {
      const input = 'x'.repeat(1500);
      const result = pureEnv.generateQRData(input, { maxChunkSize: 500 });
      
      expect(result).toHaveLength(3); // 1500 / 500 = 3
      result.forEach((frame, idx) => {
        if (idx < 2) {
          expect(frame.data).toHaveLength(500);
        } else {
          expect(frame.data).toHaveLength(500); // Last chunk
        }
      });
    });
  });
  
  describe('QR Parsing Logic', () => {
    describe('Basic Parsing', () => {
      test('should parse single frame data', () => {
        const input = 'Parse me';
        const generated = pureEnv.generateQRData(input);
        
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(result.metadata).toBeDefined();
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should parse multi-frame data', () => {
        const input = 'x'.repeat(2000);
        const generated = pureEnv.generateQRData(input);
        
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(result.integrity.valid).toBe(true);
      });
    });
    
    describe('Unicode and Special Characters', () => {
      test('should handle unicode characters correctly', () => {
        const input = '你好世界 🌍 émojis ñiño';
        const generated = pureEnv.generateQRData(input);
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(result.metadata.encoding).toBe('utf-8');
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should handle special characters and symbols', () => {
        const input = '!@#$%^&*(){}[]|\\:;"\'<>,.?/~`';
        const generated = pureEnv.generateQRData(input);
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should handle newlines and control characters', () => {
        const input = 'Line 1\nLine 2\r\nLine 3\tTabbed';
        const generated = pureEnv.generateQRData(input);
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(result.integrity.valid).toBe(true);
      });
    });
    
    describe('Binary Data Handling', () => {
      test('should handle base64 encoded binary data', () => {
        const binaryContent = 'Binary data with null bytes \x00\x01\x02';
        const input = btoa(binaryContent);
        const generated = pureEnv.generateQRData(input);
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toBe(input);
        expect(atob(result.data)).toBe(binaryContent);
        expect(result.integrity.valid).toBe(true);
      });
    });
    
    describe('Error Handling and Edge Cases', () => {
      test('should detect missing frames', () => {
        const input = 'x'.repeat(2000);
        const generated = pureEnv.generateQRData(input);
        
        // Remove middle frame
        const incomplete = [generated[0], generated[2]];
        
        const result = pureEnv.parseQRData(incomplete);
        
        expect(result.error).toContain('Missing frames');
      });
      
      test('should handle out-of-order frames', () => {
        const input = 'x'.repeat(2000);
        const generated = pureEnv.generateQRData(input);
        
        // Shuffle frames
        const shuffled = [generated[2], generated[0], generated[1]];
        
        const result = pureEnv.parseQRData(shuffled);
        
        expect(result.data).toBe(input);
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should validate data integrity', () => {
        const input = 'Integrity check';
        const generated = pureEnv.generateQRData(input);
        
        // Corrupt the data
        generated[0].raw = generated[0].raw.replace('Integrity', 'Corrupted');
        
        const result = pureEnv.parseQRData(generated);
        
        expect(result.data).toContain('Corrupted');
        expect(result.integrity.valid).toBe(false);
        expect(result.integrity.reason).toBe('Checksum mismatch');
      });
      
      test('should handle duplicate frames gracefully', () => {
        const input = 'x'.repeat(1500);
        const generated = pureEnv.generateQRData(input);
        
        // Add duplicate frame
        const withDuplicate = [...generated, generated[0]];
        
        const result = pureEnv.parseQRData(withDuplicate);
        
        expect(result.data).toBe(input);
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should handle empty input', () => {
        const input = '';
        const generated = pureEnv.generateQRData(input);
        
        expect(generated).toHaveLength(1);
        expect(generated[0].data).toBe('');
        
        const result = pureEnv.parseQRData(generated);
        expect(result.data).toBe('');
        expect(result.integrity.valid).toBe(true);
      });
      
      test('should handle malformed frame data', () => {
        const malformedFrames = [{
          frameNumber: 1,
          totalFrames: 1,
          data: 'test',
          metadata: null,
          raw: 'invalid-json-{'
        }];
        
        const result = pureEnv.parseQRData(malformedFrames);
        
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid frame data');
      });
    });
  });
  
  describe('Cross-Test Data Sharing', () => {
    test('should share data between generation and parsing tests', () => {
      // Simulate generation test storing data
      const input = 'Shared data';
      const generated = pureEnv.generateQRData(input);
      testDataFlow.storeGeneratedData('shared-test-1', { frames: generated });
      
      // Simulate parsing test retrieving data
      const stored = testDataFlow.retrieveStoredData('shared-test-1');
      expect(stored).toBeDefined();
      expect(stored.frames).toEqual(generated);
      
      // Parse the stored data
      const result = pureEnv.parseQRData(stored.frames);
      expect(result.data).toBe(input);
    });
  });
});

describe('Segmented QR Testing - Layer 2: Integration', () => {
  let integrationEnv;
  let pureEnv;
  
  beforeEach(() => {
    integrationEnv = QRTestArchitecture.createIntegrationTestEnvironment();
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
  });
  
  describe('Canvas Integration', () => {
    test('should create mock canvas for QR rendering', () => {
      const canvas = integrationEnv.mockCanvas.create(256, 256);
      
      expect(canvas.width).toBe(256);
      expect(canvas.height).toBe(256);
      expect(canvas.context).toBeDefined();
      expect(canvas.toDataURL()).toContain('data:image/png');
    });
    
    test('should generate image data for QR codes', () => {
      const canvas = integrationEnv.mockCanvas.create(256, 256);
      const imageData = canvas.getImageData(0, 0, 256, 256);
      
      expect(imageData.data).toBeInstanceOf(Uint8ClampedArray);
      expect(imageData.width).toBe(256);
      expect(imageData.height).toBe(256);
    });
  });
  
  describe('Media Stream Integration', () => {
    test('should simulate QR code stream from camera', () => {
      // Generate QR frames
      const input = 'Camera data';
      const qrFrames = pureEnv.generateQRData(input);
      
      // Create mock stream
      const stream = integrationEnv.mockMediaStream.create(qrFrames);
      
      expect(stream.active).toBe(true);
      expect(stream.frames).toEqual(qrFrames);
      
      // Simulate reading frames
      const frame1 = stream.getNextFrame();
      expect(frame1).toEqual(qrFrames[0]);
      
      // Should cycle back to first frame
      const frame2 = stream.getNextFrame();
      expect(frame2).toEqual(qrFrames[0]);
    });
    
    test('should handle multi-frame sequences', () => {
      const input = 'x'.repeat(2000);
      const qrFrames = pureEnv.generateQRData(input);
      const stream = integrationEnv.mockMediaStream.create(qrFrames);
      
      // Read all frames in sequence
      const readFrames = [];
      for (let i = 0; i < qrFrames.length; i++) {
        readFrames.push(stream.getNextFrame());
      }
      
      expect(readFrames).toEqual(qrFrames);
    });
  });
  
  describe('Clipboard Integration', () => {
    test('should write and read from mock clipboard', async () => {
      const clipboard = integrationEnv.mockClipboard;
      const testData = 'Clipboard test data';
      
      await clipboard.writeText(testData);
      const result = await clipboard.readText();
      
      expect(result).toBe(testData);
    });
    
    test('should handle QR data through clipboard', async () => {
      const clipboard = integrationEnv.mockClipboard;
      const input = 'QR via clipboard';
      const qrFrames = pureEnv.generateQRData(input);
      
      // Simulate copying QR data
      const serialized = JSON.stringify(qrFrames);
      await clipboard.writeText(serialized);
      
      // Simulate pasting and parsing
      const pasted = await clipboard.readText();
      const parsed = JSON.parse(pasted);
      const result = pureEnv.parseQRData(parsed);
      
      expect(result.data).toBe(input);
    });
  });
});

describe('Segmented QR Testing - Data Reconstruction', () => {
  let pureEnv;
  let testDataFlow;
  
  beforeEach(() => {
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
    testDataFlow = QRTestArchitecture.createTestDataFlow();
  });
  
  describe('Chunk Reconstruction', () => {
    test('should reconstruct data from properly ordered chunks', () => {
      const input = 'Chunk reconstruction test with multiple parts';
      const generated = pureEnv.generateQRData(input, { maxChunkSize: 15 }); // Force multiple chunks
      
      expect(generated.length).toBeGreaterThan(1);
      
      const result = pureEnv.parseQRData(generated);
      expect(result.data).toBe(input);
      expect(result.integrity.valid).toBe(true);
    });
    
    test('should handle chunks received in random order', () => {
      const input = 'x'.repeat(2400); // 3 chunks of 800 each
      const generated = pureEnv.generateQRData(input);
      
      // Randomly shuffle frames
      const shuffled = [generated[2], generated[0], generated[1]];
      
      const result = pureEnv.parseQRData(shuffled);
      expect(result.data).toBe(input);
      expect(result.integrity.valid).toBe(true);
    });
    
    test('should detect and handle duplicate chunks', () => {
      const input = 'x'.repeat(1600); // 2 chunks
      const generated = pureEnv.generateQRData(input);
      
      // Add duplicate of first chunk
      const withDuplicate = [generated[0], generated[1], generated[0]];
      
      const result = pureEnv.parseQRData(withDuplicate);
      expect(result.data).toBe(input);
      expect(result.integrity.valid).toBe(true);
    });
  });
  
  describe('Error Recovery', () => {
    test('should identify specific missing chunks', () => {
      const input = 'x'.repeat(3200); // 4 chunks
      const generated = pureEnv.generateQRData(input);
      
      // Remove chunks 1 and 3 (0-indexed)
      const incomplete = [generated[0], generated[2]];
      
      const result = pureEnv.parseQRData(incomplete);
      expect(result.error).toContain('Missing frames: 1, 3');
    });
    
    test('should handle completely corrupted chunk data', () => {
      const input = 'Test data';
      const generated = pureEnv.generateQRData(input);
      
      // Corrupt the raw frame data completely
      generated[0].raw = 'completely-invalid-data-not-json';
      
      const result = pureEnv.parseQRData(generated);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid frame data');
    });
    
    test('should handle inconsistent frame totals', () => {
      const input = 'x'.repeat(1600); // 2 chunks
      const generated = pureEnv.generateQRData(input);
      
      // Modify second frame to claim different total
      const corrupted = JSON.parse(generated[1].raw);
      corrupted.t = 3; // Claim 3 total instead of 2
      generated[1].raw = JSON.stringify(corrupted);
      
      const result = pureEnv.parseQRData(generated);
      expect(result.error).toContain('Inconsistent total frame count');
    });
  });
  
  describe('Performance and Efficiency', () => {
    test('should reconstruct large data efficiently', () => {
      const input = 'x'.repeat(8000); // 10 chunks
      const start = performance.now();
      
      const generated = pureEnv.generateQRData(input);
      const result = pureEnv.parseQRData(generated);
      
      const elapsed = performance.now() - start;
      
      expect(result.data).toBe(input);
      expect(elapsed).toBeLessThan(10); // Must be under 10ms
    });
    
    test('should handle maximum chunk scenario', () => {
      const input = 'x'.repeat(10000); // Maximum text length
      const start = performance.now();
      
      const generated = pureEnv.generateQRData(input);
      const result = pureEnv.parseQRData(generated);
      
      const elapsed = performance.now() - start;
      
      expect(result.data).toBe(input);
      expect(generated.length).toBe(13); // 10000 / 800 = 12.5, so 13 chunks
      expect(elapsed).toBeLessThan(10); // Must be under 10ms
    });
  });
});

describe('Segmented QR Testing - Performance Validation', () => {
  let pureEnv;
  let testDataFlow;
  
  beforeEach(() => {
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
    testDataFlow = QRTestArchitecture.createTestDataFlow();
  });
  
  describe('Performance Requirements (<10ms per test)', () => {
    test('should generate small data quickly', () => {
      const input = 'x'.repeat(50);
      const start = performance.now();
      
      const result = pureEnv.generateQRData(input);
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(result).toHaveLength(1);
    });
    
    test('should generate medium data quickly', () => {
      const input = 'x'.repeat(500);
      const start = performance.now();
      
      const result = pureEnv.generateQRData(input);
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(result).toHaveLength(1);
    });
    
    test('should parse small data quickly', () => {
      const input = 'x'.repeat(50);
      const generated = pureEnv.generateQRData(input);
      
      const start = performance.now();
      const result = pureEnv.parseQRData(generated);
      const elapsed = performance.now() - start;
      
      expect(elapsed).toBeLessThan(10);
      expect(result.data).toBe(input);
    });
    
    test('should parse large chunked data quickly', () => {
      const input = 'x'.repeat(3200); // 4 chunks
      const generated = pureEnv.generateQRData(input);
      
      const start = performance.now();
      const result = pureEnv.parseQRData(generated);
      const elapsed = performance.now() - start;
      
      expect(elapsed).toBeLessThan(10);
      expect(result.data).toBe(input);
    });
    
    test('should handle round-trip performance for various sizes', () => {
      const testSizes = [10, 100, 500, 800, 1000, 2000, 5000];
      
      testSizes.forEach(size => {
        const input = 'x'.repeat(size);
        
        const start = performance.now();
        const generated = pureEnv.generateQRData(input);
        const parsed = pureEnv.parseQRData(generated);
        const elapsed = performance.now() - start;
        
        expect(elapsed).toBeLessThan(10);
        expect(parsed.data).toBe(input);
        
        testDataFlow.storeGeneratedData(`perf-test-${size}`, {
          frames: generated,
          executionTime: elapsed,
          dataSize: size
        });
      });
    });
  });
});

describe('Segmented QR Testing - Test Scenarios', () => {
  let pureEnv;
  let testDataFlow;
  
  beforeEach(() => {
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
    testDataFlow = QRTestArchitecture.createTestDataFlow();
  });
  
  test('should handle all generated test scenarios', () => {
    const testScenarios = testDataFlow.generateTestScenarios();
    expect(testScenarios).toBeDefined();
    expect(testScenarios.length).toBeGreaterThan(0);
    
    testScenarios.forEach(scenario => {
      const start = performance.now();
      
      const generated = pureEnv.generateQRData(scenario.input);
      
      // Verify frame count
      expect(generated).toHaveLength(scenario.expectedFrames);
      
      // Verify round-trip
      const parsed = pureEnv.parseQRData(generated);
      expect(parsed.data).toBe(scenario.input);
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10); // Each test must be under 10ms
      
      // Store for reference
      testDataFlow.storeGeneratedData(scenario.id, { 
        frames: generated,
        scenario: scenario,
        executionTime: elapsed
      });
    });
  });
});

describe('Segmented QR Testing - Deterministic Validation', () => {
  let pureEnv;
  let testDataFlow;
  
  beforeEach(() => {
    pureEnv = QRTestArchitecture.createPureLogicTestEnvironment();
    testDataFlow = QRTestArchitecture.createTestDataFlow();
  });
  
  describe('Deterministic Checksum Validation', () => {
    test('should produce consistent checksums for same input', () => {
      const input = 'Deterministic test data';
      
      const result1 = pureEnv.generateQRData(input);
      const result2 = pureEnv.generateQRData(input);
      const result3 = pureEnv.generateQRData(input);
      
      expect(result1[0].metadata.checksum).toBe(result2[0].metadata.checksum);
      expect(result2[0].metadata.checksum).toBe(result3[0].metadata.checksum);
    });
    
    test('should validate checksums match expected values', () => {
      const testScenarios = testDataFlow.generateTestScenarios();
      expect(testScenarios).toBeDefined();
      expect(testScenarios.length).toBeGreaterThan(0);
      
      testScenarios.forEach(scenario => {
        const generated = pureEnv.generateQRData(scenario.input);
        expect(generated).toBeDefined();
        expect(generated.length).toBeGreaterThan(0);
        expect(generated[0].metadata).toBeDefined();
        
        const calculatedChecksum = generated[0].metadata.checksum;
        const expectedChecksum = scenario.expectedChecksum;
        
        expect(calculatedChecksum).toBe(expectedChecksum);
      });
    });
    
    test('should detect checksum mismatches in corrupted data', () => {
      const input = 'Checksum validation test';
      const generated = pureEnv.generateQRData(input);
      
      // Corrupt the data but keep original checksum
      const originalChecksum = generated[0].metadata.checksum;
      generated[0].raw = generated[0].raw.replace('validation', 'corruption');
      
      const result = pureEnv.parseQRData(generated);
      
      expect(result.integrity.valid).toBe(false);
      expect(result.integrity.reason).toBe('Checksum mismatch');
      expect(result.integrity.expected).toBe(originalChecksum);
      expect(result.integrity.actual).not.toBe(originalChecksum);
    });
  });
  
  describe('Cross-Test Data Validation', () => {
    test('should maintain data consistency across test runs', () => {
      const input = 'Cross-test validation';
      
      // Generate and store in first test
      const generated = pureEnv.generateQRData(input);
      testDataFlow.storeGeneratedData('cross-test-1', { frames: generated });
      
      // Retrieve and validate in second test
      const stored = testDataFlow.retrieveStoredData('cross-test-1');
      expect(stored).toBeDefined();
      expect(stored.frames).toEqual(generated);
      
      // Parse stored data
      const result = pureEnv.parseQRData(stored.frames);
      expect(result.data).toBe(input);
      expect(result.integrity.valid).toBe(true);
    });
    
    test('should track performance metrics across tests', () => {
      const testSizes = [100, 1000, 5000];
      
      testSizes.forEach(size => {
        const input = 'x'.repeat(size);
        const start = performance.now();
        
        const generated = pureEnv.generateQRData(input);
        const parsed = pureEnv.parseQRData(generated);
        
        const elapsed = performance.now() - start;
        
        testDataFlow.storeGeneratedData(`metrics-test-${size}`, {
          frames: generated,
          executionTime: elapsed,
          scenario: { input, size }
        });
      });
      
      // Validate all metrics are tracked
      const metrics = testDataFlow.getPerformanceMetrics();
      expect(metrics).toHaveLength(3);
      
      metrics.forEach(metric => {
        expect(metric.executionTime).toBeLessThan(10);
        expect(metric.dataSize).toBeGreaterThan(0);
        expect(metric.frameCount).toBeGreaterThan(0);
      });
    });
  });
});