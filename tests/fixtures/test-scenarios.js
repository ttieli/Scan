// Pre-defined test scenarios for consistent testing across different test types

const TestDataFactory = require('./test-data-factory');

class TestScenarios {
  static getBasicScenarios() {
    return {
      // Simple text scenarios
      simpleText: {
        input: 'Hello, World!',
        expectedFrames: ['Hello, World!'],
        description: 'Basic ASCII text transmission'
      },

      emptyInput: {
        input: '',
        expectedFrames: [],
        expectWarning: true,
        description: 'Empty input should show warning'
      },

      whitespaceOnly: {
        input: '   \n\t   ',
        expectedFrames: [],
        expectWarning: true,
        description: 'Whitespace-only input should show warning'
      },

      unicodeText: {
        input: '你好世界 🌍 Hello Wörld!',
        expectedFrames: ['你好世界 🌍 Hello Wörld!'],
        description: 'Unicode characters and emojis'
      },

      specialCharacters: {
        input: 'Special: !@#$%^&*()[]{}|;:,.<>?',
        expectedFrames: ['Special: !@#$%^&*()[]{}|;:,.<>?'],
        description: 'Special characters handling'
      },

      newlinesAndTabs: {
        input: 'Line 1\nLine 2\r\nLine 3\tTabbed',
        expectedFrames: ['Line 1\nLine 2\r\nLine 3\tTabbed'],
        description: 'Newlines and tab characters'
      },

      quotes: {
        input: 'Single \'quotes\' and "double quotes"',
        expectedFrames: ['Single \'quotes\' and "double quotes"'],
        description: 'Quote characters handling'
      }
    };
  }

  static getPerformanceScenarios() {
    return {
      // Performance test scenarios
      smallData: {
        input: TestDataFactory.generateText({ size: 100 }),
        maxGenerationTime: 100,
        maxProcessingTime: 50,
        description: 'Small data performance'
      },

      mediumData: {
        input: TestDataFactory.generateText({ size: 1000 }),
        maxGenerationTime: 200,
        maxProcessingTime: 100,
        description: 'Medium data performance'
      },

      largeData: {
        input: TestDataFactory.generateText({ size: 5000 }),
        maxGenerationTime: 500,
        maxProcessingTime: 200,
        description: 'Large data performance'
      },

      maxSizeData: {
        input: TestDataFactory.generateText({ size: 10000 }),
        maxGenerationTime: 1000,
        maxProcessingTime: 500,
        description: 'Maximum size data performance'
      },

      rapidGeneration: {
        iterations: 20,
        inputGenerator: (i) => `Rapid test ${i}: ${TestDataFactory.generateText({ size: 50 })}`,
        maxAverageTime: 100,
        maxTotalTime: 3000,
        description: 'Rapid successive QR generations'
      },

      stressTest: {
        iterations: 100,
        inputGenerator: (i) => TestDataFactory.generateText({ size: 200 }),
        maxAverageTime: 150,
        description: 'Stress test with many operations'
      }
    };
  }

  static getSecurityScenarios() {
    return {
      // XSS prevention scenarios
      scriptInjection: {
        input: '<script>alert("XSS")</script>',
        expectedFrames: ['<script>alert("XSS")</script>'],
        shouldNotExecute: true,
        description: 'Script tag injection attempt'
      },

      imgOnError: {
        input: '<img src="x" onerror="alert(\'XSS\')">',
        expectedFrames: ['<img src="x" onerror="alert(\'XSS\')">'],
        shouldNotExecute: true,
        description: 'Image onerror injection'
      },

      javascriptProtocol: {
        input: 'javascript:alert("XSS")',
        expectedFrames: ['javascript:alert("XSS")'],
        shouldNotExecute: true,
        description: 'Javascript protocol injection'
      },

      htmlBreakout: {
        input: '"><script>alert("XSS")</script>',
        expectedFrames: ['"><script>alert("XSS")</script>'],
        shouldNotExecute: true,
        description: 'HTML attribute breakout'
      },

      eventHandlers: {
        input: 'onclick="alert(\'XSS\')" onload="alert(\'XSS2\')"',
        expectedFrames: ['onclick="alert(\'XSS\')" onload="alert(\'XSS2\')"'],
        shouldNotExecute: true,
        description: 'Event handler injection'
      },

      templateInjection: {
        input: '{{7*7}} ${alert("XSS")} #{eval("alert(1)")}',
        expectedFrames: ['{{7*7}} ${alert("XSS")} #{eval("alert(1)")}'],
        shouldNotExecute: true,
        description: 'Template injection attempts'
      },

      // Data validation scenarios
      nullBytes: {
        input: 'Data\0with\0null\0bytes',
        expectedFrames: ['Data\0with\0null\0bytes'],
        description: 'Null byte handling'
      },

      controlCharacters: {
        input: 'Control\x01chars\x02test\x03',
        expectedFrames: ['Control\x01chars\x02test\x03'],
        description: 'Control characters handling'
      },

      oversizedData: {
        input: TestDataFactory.generateText({ size: 100000 }),
        shouldComplete: true,
        maxTime: 5000,
        description: 'Oversized data handling'
      },

      prototypePollution: {
        storageData: { "__proto__": { "polluted": true }, "data": "test" },
        shouldNotPollute: true,
        description: 'Prototype pollution prevention'
      }
    };
  }

  static getIntegrationScenarios() {
    return {
      // End-to-end scenarios
      basicTransfer: {
        senderInput: 'Integration test data',
        expectedReceiverOutput: 'Integration test data',
        steps: [
          'generate_qr',
          'simulate_scan', 
          'process_data',
          'verify_storage'
        ],
        description: 'Basic data transfer flow'
      },

      largeDataTransfer: {
        senderInput: TestDataFactory.generateText({ size: 5000 }),
        expectedReceiverOutput: TestDataFactory.generateText({ size: 5000 }),
        steps: [
          'generate_qr',
          'simulate_scan',
          'process_data',
          'verify_storage',
          'verify_performance'
        ],
        description: 'Large data transfer'
      },

      unicodeTransfer: {
        senderInput: '数据传输测试 🚀 Data Transfer Test Тест передачи данных',
        expectedReceiverOutput: '数据传输测试 🚀 Data Transfer Test Тест передачи данных',
        steps: [
          'generate_qr',
          'simulate_scan',
          'process_data',
          'verify_unicode'
        ],
        description: 'Unicode data preservation'
      },

      errorRecovery: {
        senderInput: 'Error recovery test',
        simulateErrors: ['camera_failure', 'storage_error', 'qr_generation_error'],
        expectedRecovery: true,
        description: 'Error handling and recovery'
      },

      sessionManagement: {
        sessions: [
          { data: 'Session 1 data', timestamp: new Date('2024-01-01') },
          { data: 'Session 2 data', timestamp: new Date('2024-01-02') },
          { data: 'Session 3 data', timestamp: new Date('2024-01-03') }
        ],
        operations: ['save', 'load', 'delete', 'clear_all'],
        description: 'Session storage management'
      },

      configurationTest: {
        configurations: [
          { qrSize: 128, interval: 1000, errorLevel: 'L' },
          { qrSize: 256, interval: 1500, errorLevel: 'M' },
          { qrSize: 512, interval: 2000, errorLevel: 'H' }
        ],
        testData: 'Configuration test data',
        description: 'Different configuration settings'
      }
    };
  }

  static getE2EScenarios() {
    return {
      // Browser automation scenarios
      senderWorkflow: {
        name: 'Complete Sender Workflow',
        steps: [
          { action: 'navigate', url: 'sender.html' },
          { action: 'waitForLoad' },
          { action: 'fillText', selector: '#textInput', value: 'E2E test data' },
          { action: 'click', selector: '#generateBtn' },
          { action: 'waitForElement', selector: '#qrDisplay canvas' },
          { action: 'verifyVisible', selector: '#qrDisplay canvas' },
          { action: 'click', selector: '#playBtn' },
          { action: 'verifyDisabled', selector: '#playBtn' },
          { action: 'verifyEnabled', selector: '#pauseBtn' },
          { action: 'click', selector: '#clearBtn' },
          { action: 'verifyEmpty', selector: '#textInput' }
        ]
      },

      receiverWorkflow: {
        name: 'Complete Receiver Workflow',
        steps: [
          { action: 'navigate', url: 'receiver.html' },
          { action: 'waitForLoad' },
          { action: 'simulateQRScan', data: 'E2E receiver test' },
          { action: 'verifyText', selector: '#receivedData', value: 'E2E receiver test' },
          { action: 'verifyVisible', selector: '#resultsSection' },
          { action: 'click', selector: '#copyBtn' },
          { action: 'verifyStatus', text: '复制到剪贴板' },
          { action: 'click', selector: '#resetBtn' },
          { action: 'verifyEmpty', selector: '#receivedData' }
        ]
      },

      responsiveDesign: {
        name: 'Responsive Design Test',
        viewports: [
          { width: 1920, height: 1080, name: 'Desktop' },
          { width: 768, height: 1024, name: 'Tablet' },
          { width: 375, height: 667, name: 'Mobile' }
        ],
        tests: [
          { action: 'verifyLayout' },
          { action: 'testBasicFunctionality' },
          { action: 'verifyTouchTargets' }
        ]
      },

      crossBrowser: {
        name: 'Cross-Browser Compatibility',
        browsers: ['chromium', 'firefox', 'webkit'],
        tests: [
          { action: 'basicFunctionality' },
          { action: 'qrGeneration' },
          { action: 'storageOperations' },
          { action: 'uiInteractions' }
        ]
      },

      accessibilityTest: {
        name: 'Accessibility Testing',
        checks: [
          { action: 'keyboardNavigation' },
          { action: 'screenReaderSupport' },
          { action: 'colorContrast' },
          { action: 'focusManagement' }
        ]
      },

      performanceE2E: {
        name: 'E2E Performance Testing',
        scenarios: [
          {
            name: 'QR Generation Performance',
            setup: { textSize: 5000 },
            measure: ['generation_time', 'ui_response_time'],
            thresholds: { generation_time: 1000, ui_response_time: 100 }
          },
          {
            name: 'Storage Performance',
            setup: { sessionCount: 50 },
            measure: ['save_time', 'load_time', 'list_time'],
            thresholds: { save_time: 100, load_time: 50, list_time: 200 }
          }
        ]
      }
    };
  }

  static getCameraScenarios() {
    return {
      // Camera-specific test scenarios
      cameraPermissionGranted: {
        mockResponse: 'granted',
        expectedBehavior: 'camera_starts',
        expectedUI: ['video_visible', 'stop_enabled', 'start_disabled'],
        description: 'Camera permission granted'
      },

      cameraPermissionDenied: {
        mockResponse: 'denied',
        expectedBehavior: 'error_shown',
        expectedUI: ['error_message', 'start_enabled', 'stop_disabled'],
        description: 'Camera permission denied'
      },

      cameraNotFound: {
        mockError: 'NotFoundError',
        expectedBehavior: 'error_shown',
        expectedMessage: 'Camera not found',
        description: 'No camera device available'
      },

      cameraInUse: {
        mockError: 'NotReadableError',
        expectedBehavior: 'error_shown',
        expectedMessage: 'Camera is already in use',
        description: 'Camera already in use by another application'
      },

      qrDetection: {
        mockImageData: TestDataFactory.generateImageData(640, 480, true),
        expectedQRData: 'Mock QR data from camera',
        expectedBehavior: 'data_processed',
        description: 'Successful QR code detection'
      },

      noQRDetection: {
        mockImageData: TestDataFactory.generateImageData(640, 480, false),
        expectedQRData: null,
        expectedBehavior: 'continue_scanning',
        description: 'No QR code detected in frame'
      },

      rapidQRDetection: {
        iterations: 10,
        mockData: (i) => `Rapid QR ${i}`,
        expectedBehavior: 'process_unique_only',
        description: 'Rapid successive QR detections'
      }
    };
  }

  static getErrorScenarios() {
    return {
      // Error handling scenarios
      qrGenerationErrors: [
        {
          trigger: 'mock_qr_library_error',
          expectedHandling: 'show_error_message',
          expectedRecovery: 'user_can_retry',
          description: 'QR library throws error'
        },
        {
          trigger: 'canvas_creation_failure',
          expectedHandling: 'graceful_degradation',
          expectedRecovery: 'fallback_display',
          description: 'Canvas creation fails'
        }
      ],

      storageErrors: [
        {
          trigger: 'quota_exceeded',
          expectedHandling: 'show_quota_error',
          expectedRecovery: 'suggest_cleanup',
          description: 'LocalStorage quota exceeded'
        },
        {
          trigger: 'storage_unavailable',
          expectedHandling: 'show_storage_error',
          expectedRecovery: 'continue_without_storage',
          description: 'LocalStorage not available'
        },
        {
          trigger: 'corrupted_data',
          expectedHandling: 'ignore_corrupted_entries',
          expectedRecovery: 'load_valid_sessions',
          description: 'Corrupted data in storage'
        }
      ],

      networkErrors: [
        {
          trigger: 'offline_mode',
          expectedHandling: 'continue_offline',
          expectedRecovery: 'all_features_work',
          description: 'Application works offline'
        }
      ]
    };
  }

  static getConfigurationScenarios() {
    return {
      // Configuration testing scenarios
      qrSizeVariations: [
        { size: 128, description: 'Minimum QR size' },
        { size: 256, description: 'Default QR size' },
        { size: 384, description: 'Medium QR size' },
        { size: 512, description: 'Maximum QR size' }
      ],

      intervalVariations: [
        { interval: 500, description: 'Fast playback' },
        { interval: 1500, description: 'Default playback' },
        { interval: 3000, description: 'Slow playback' }
      ],

      errorCorrectionLevels: [
        { level: 'L', description: 'Low error correction (~7%)' },
        { level: 'M', description: 'Medium error correction (~15%)' },
        { level: 'Q', description: 'Quartile error correction (~25%)' },
        { level: 'H', description: 'High error correction (~30%)' }
      ],

      combinedConfigurations: [
        { size: 128, interval: 500, level: 'L', description: 'Fast, small, low correction' },
        { size: 256, interval: 1500, level: 'M', description: 'Default settings' },
        { size: 512, interval: 3000, level: 'H', description: 'Slow, large, high correction' }
      ]
    };
  }

  // Utility method to get scenario by category and name
  static getScenario(category, name) {
    const scenarios = {
      basic: this.getBasicScenarios(),
      performance: this.getPerformanceScenarios(),
      security: this.getSecurityScenarios(),
      integration: this.getIntegrationScenarios(),
      e2e: this.getE2EScenarios(),
      camera: this.getCameraScenarios(),
      error: this.getErrorScenarios(),
      config: this.getConfigurationScenarios()
    };

    return scenarios[category] && scenarios[category][name];
  }

  // Generate a complete test suite with all scenario types
  static generateComprehensiveTestSuite() {
    return {
      basic: this.getBasicScenarios(),
      performance: this.getPerformanceScenarios(),
      security: this.getSecurityScenarios(),
      integration: this.getIntegrationScenarios(),
      e2e: this.getE2EScenarios(),
      camera: this.getCameraScenarios(),
      error: this.getErrorScenarios(),
      config: this.getConfigurationScenarios(),
      meta: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        totalScenarios: Object.values(this.getBasicScenarios()).length +
                       Object.values(this.getPerformanceScenarios()).length +
                       Object.values(this.getSecurityScenarios()).length +
                       Object.values(this.getIntegrationScenarios()).length
      }
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestScenarios;
}

if (typeof window !== 'undefined') {
  window.TestScenarios = TestScenarios;
}

if (typeof global !== 'undefined') {
  global.TestScenarios = TestScenarios;
}