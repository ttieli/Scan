/**
 * QR Test Architecture - Segmented Testing Strategy
 * 
 * This module defines the core testing architecture for QR data transfer,
 * implementing a pragmatic segmented approach that bypasses browser APIs
 * while ensuring core logic integrity.
 * 
 * Testing Layers:
 * 1. Pure Logic Layer - No browser dependencies
 * 2. Integration Layer - Controlled browser API simulation  
 * 3. E2E Layer - Real browser testing (Playwright)
 */

class QRTestArchitecture {
  /**
   * Layer 1: Pure Logic Testing
   * Tests QR generation and parsing without browser dependencies
   */
  static createPureLogicTestEnvironment() {
    return {
      // QR Generation pure logic
      generateQRData: (text, options = {}) => {
        const config = {
          maxChunkSize: options.maxChunkSize || 800,
          errorCorrectionLevel: options.errorCorrectionLevel || 'M',
          format: options.format || 'json'
        };
        
        // Pure chunking logic - handle empty text
        const chunks = text === '' ? [''] : this.chunkData(text, config.maxChunkSize);
        
        // Generate metadata
        const metadata = {
          totalChunks: chunks.length,
          timestamp: Date.now(),
          checksum: this.calculateChecksum(text),
          encoding: 'utf-8'
        };
        
        // Return testable QR frames
        return chunks.map((chunk, index) => ({
          frameNumber: index + 1,
          totalFrames: chunks.length,
          data: chunk,
          metadata: index === 0 ? metadata : null,
          raw: this.encodeFrame(chunk, index, chunks.length, metadata)
        }));
      },
      
      // QR Parsing pure logic
      parseQRData: (frames) => {
        const parsedFrames = frames.map(frame => 
          this.decodeFrame(frame.raw)
        );
        
        // Validate frame sequence
        const validation = this.validateFrameSequence(parsedFrames);
        if (!validation.valid) {
          return { error: validation.error };
        }
        
        // Use unique frames if duplicates were removed
        const framesToUse = validation.uniqueFrames || parsedFrames;
        
        // Reconstruct data
        const reconstructed = this.reconstructData(framesToUse);
        
        return {
          data: reconstructed.text,
          metadata: reconstructed.metadata,
          integrity: this.verifyIntegrity(reconstructed)
        };
      }
    };
  }
  
  /**
   * Layer 2: Integration Testing with Controlled Mocks
   * Tests component integration with deterministic browser API mocks
   */
  static createIntegrationTestEnvironment() {
    return {
      // Controlled Canvas mock for QR rendering
      mockCanvas: {
        create: (width, height) => ({
          width,
          height,
          context: this.createMockContext2D(),
          toDataURL: () => this.generateMockQRImage(width, height),
          getImageData: (x, y, w, h) => this.generateMockImageData(x, y, w, h)
        })
      },
      
      // Controlled Media mock for camera simulation
      mockMediaStream: {
        create: (qrFrames) => ({
          active: true,
          frames: qrFrames,
          currentFrame: 0,
          getNextFrame: function() {
            const frame = this.frames[this.currentFrame];
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            return frame;
          }
        })
      },
      
      // Controlled Clipboard mock
      mockClipboard: {
        data: null,
        writeText: async function(text) {
          this.data = text;
          return Promise.resolve();
        },
        readText: async function() {
          return Promise.resolve(this.data || '');
        }
      }
    };
  }
  
  /**
   * Test Data Flow Design - Shared test fixtures
   */
  static createTestDataFlow() {
    return {
      // Test data repository with enhanced capabilities
      repository: new Map(),
      performanceMetrics: new Map(),
      
      // Store generated QR data for cross-test sharing
      storeGeneratedData: function(testId, data) {
        this.repository.set(testId, {
          timestamp: Date.now(),
          data: data,
          frames: data.frames || [],
          metadata: data.metadata || {},
          scenario: data.scenario || null,
          executionTime: data.executionTime || 0
        });
        
        // Track performance metrics
        if (data.executionTime) {
          this.performanceMetrics.set(testId, {
            executionTime: data.executionTime,
            dataSize: data.scenario ? data.scenario.input.length : 0,
            frameCount: (data.frames || []).length
          });
        }
      },
      
      // Retrieve stored data for parsing tests
      retrieveStoredData: function(testId) {
        return this.repository.get(testId);
      },
      
      // Get all stored test data for analysis
      getAllStoredData: function() {
        return Array.from(this.repository.entries()).map(([id, data]) => ({
          testId: id,
          ...data
        }));
      },
      
      // Get performance metrics
      getPerformanceMetrics: function() {
        return Array.from(this.performanceMetrics.entries()).map(([id, metrics]) => ({
          testId: id,
          ...metrics
        }));
      },
      
      // Clear repository (for test isolation)
      clearRepository: function() {
        this.repository.clear();
        this.performanceMetrics.clear();
      },
      
      // Generate deterministic test scenarios with improved checksums
      generateTestScenarios: () => {
        const scenarios = [
          {
            id: 'tiny-data',
            input: 'Hi',
            expectedFrames: 1,
            category: 'small'
          },
          {
            id: 'small-boundary',
            input: 'x'.repeat(99),
            expectedFrames: 1,
            category: 'small'
          },
          {
            id: 'medium-start',
            input: 'x'.repeat(100),
            expectedFrames: 1,
            category: 'medium'
          },
          {
            id: 'medium-middle',
            input: 'x'.repeat(500),
            expectedFrames: 1,
            category: 'medium'
          },
          {
            id: 'chunk-boundary',
            input: 'x'.repeat(800),
            expectedFrames: 1,
            category: 'medium'
          },
          {
            id: 'medium-end',
            input: 'x'.repeat(1000),
            expectedFrames: 2,
            category: 'medium'
          },
          {
            id: 'large-small',
            input: 'x'.repeat(2000),
            expectedFrames: 3,
            category: 'large'
          },
          {
            id: 'large-medium',
            input: 'x'.repeat(5000),
            expectedFrames: 7,
            category: 'large'
          },
          {
            id: 'large-max',
            input: 'x'.repeat(10000),
            expectedFrames: 13,
            category: 'large'
          },
          {
            id: 'unicode-mixed',
            input: '你好世界 🌍 émojis ñiño',
            expectedFrames: 1,
            category: 'unicode'
          },
          {
            id: 'special-chars',
            input: '!@#$%^&*(){}[]|\\:;"\'<>,.?/~`',
            expectedFrames: 1,
            category: 'special'
          },
          {
            id: 'binary-encoded',
            input: btoa('Binary content with null bytes \x00\x01\x02'),
            expectedFrames: 1,
            category: 'binary'
          },
          {
            id: 'empty-data',
            input: '',
            expectedFrames: 1,
            category: 'edge'
          }
        ];
        
        // Calculate deterministic checksums for each scenario using static method
        return scenarios.map(scenario => ({
          ...scenario,
          expectedChecksum: QRTestArchitecture.calculateChecksum(scenario.input)
        }));
      },
      
      // Calculate deterministic checksum for test validation
      calculateDeterministicChecksum: function(text) {
        return QRTestArchitecture.calculateChecksum(text);
      }
    };
  }
  
  // Helper methods for pure logic
  static chunkData(text, maxSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxSize) {
      chunks.push(text.slice(i, i + maxSize));
    }
    return chunks;
  }
  
  static calculateChecksum(text) {
    // Simple checksum for testing (replace with crypto in production)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  static encodeFrame(chunk, index, total, metadata) {
    return JSON.stringify({
      v: 1, // version
      i: index,
      t: total,
      d: chunk,
      m: index === 0 ? metadata : undefined
    });
  }
  
  static decodeFrame(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { error: 'Invalid frame data' };
    }
  }
  
  static validateFrameSequence(frames) {
    if (!frames || frames.length === 0) {
      return { valid: false, error: 'No frames provided' };
    }
    
    // Check for any invalid frames
    const invalidFrames = frames.filter(f => !f || f.error);
    if (invalidFrames.length > 0) {
      return { valid: false, error: 'Invalid frame data' };
    }
    
    // Remove duplicates based on frame index
    const uniqueFrames = [];
    const seenIndices = new Set();
    
    frames.forEach(frame => {
      if (!seenIndices.has(frame.i)) {
        seenIndices.add(frame.i);
        uniqueFrames.push(frame);
      }
    });
    
    // Check for missing frames based on unique frames
    const frameIndices = uniqueFrames.map(f => f.i).sort((a, b) => a - b);
    const expectedIndices = Array.from({ length: uniqueFrames[0].t }, (_, i) => i);
    
    const missing = expectedIndices.filter(i => !frameIndices.includes(i));
    if (missing.length > 0) {
      return { valid: false, error: `Missing frames: ${missing.join(', ')}` };
    }
    
    // Check total consistency
    const totals = [...new Set(uniqueFrames.map(f => f.t))];
    if (totals.length !== 1) {
      return { valid: false, error: 'Inconsistent total frame count' };
    }
    
    return { valid: true, uniqueFrames };
  }
  
  static reconstructData(frames) {
    const sortedFrames = frames.sort((a, b) => a.i - b.i);
    const text = sortedFrames.map(f => f.d).join('');
    const metadata = sortedFrames[0].m || {};
    
    return { text, metadata };
  }
  
  static verifyIntegrity(reconstructed) {
    if (!reconstructed.metadata.checksum) {
      return { valid: true, reason: 'No checksum to verify' };
    }
    
    const calculatedChecksum = this.calculateChecksum(reconstructed.text);
    const valid = calculatedChecksum === reconstructed.metadata.checksum;
    
    return {
      valid,
      reason: valid ? 'Checksum verified' : 'Checksum mismatch',
      expected: reconstructed.metadata.checksum,
      actual: calculatedChecksum
    };
  }
  
  static createMockContext2D() {
    return {
      fillRect: jest.fn(),
      fillText: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn((x, y, w, h) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h
      }))
    };
  }
  
  static generateMockQRImage(width, height) {
    // Generate deterministic mock QR image data
    return `data:image/png;base64,mock_qr_${width}x${height}`;
  }
  
  static generateMockImageData(x, y, w, h) {
    // Generate deterministic image data for QR scanning tests
    const data = new Uint8ClampedArray(w * h * 4);
    // Fill with pattern that represents QR code
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (i % 8 < 4) ? 0 : 255;     // R
      data[i + 1] = (i % 8 < 4) ? 0 : 255; // G  
      data[i + 2] = (i % 8 < 4) ? 0 : 255; // B
      data[i + 3] = 255;                   // A
    }
    return { data, width: w, height: h };
  }
}

module.exports = QRTestArchitecture;