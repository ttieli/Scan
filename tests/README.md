# QR Data Transfer System - Test Suite

This comprehensive test suite provides thorough testing coverage for the QR Data Transfer System, ensuring reliability, security, and performance across different scenarios and environments.

## Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── sender.test.js      # QRDataSender class tests
│   └── receiver.test.js    # QRDataReceiver class tests
├── integration/            # Integration tests for complete flows
│   └── qr-flow.test.js     # End-to-end QR encoding/decoding
├── e2e/                    # Browser automation tests
│   ├── sender.spec.js      # Sender page E2E tests
│   ├── receiver.spec.js    # Receiver page E2E tests
│   ├── global-setup.js     # E2E test environment setup
│   └── global-teardown.js  # E2E test cleanup
├── performance/            # Performance and load tests
│   ├── qr-generation.test.js  # QR generation performance
│   └── qr-scanning.test.js    # QR scanning performance
├── security/               # Security and vulnerability tests
│   ├── xss-prevention.test.js   # XSS prevention tests
│   └── data-validation.test.js  # Input validation tests
├── mocks/                  # Mock implementations
│   ├── qr-libraries.js     # QR library mocks
│   ├── camera-api.js       # Camera API mocks
│   └── storage-api.js      # Storage API mocks
├── fixtures/               # Test data and scenarios
│   ├── test-data-factory.js   # Test data generation
│   └── test-scenarios.js      # Pre-defined test scenarios
├── setup.js                # Global test setup
└── htmlTransformer.js      # HTML file transformer for Jest
```

## Test Categories

### 1. Unit Tests
- **Coverage**: Individual methods and functions
- **Focus**: Logic correctness, edge cases, error handling
- **Tools**: Jest with JSDOM environment
- **Run**: `npm run test:unit`

#### Key Test Areas:
- QR code generation with various inputs
- QR data processing and validation  
- UI state management
- Configuration handling
- Error handling and recovery

### 2. Integration Tests
- **Coverage**: Complete data flow between components
- **Focus**: End-to-end functionality, data integrity
- **Tools**: Jest with mocked browser APIs
- **Run**: `npm run test:integration`

#### Key Test Areas:
- QR encoding → decoding flow
- Camera integration with QR scanning
- Storage operations with data persistence
- UI state synchronization

### 3. E2E Tests
- **Coverage**: Real browser interactions
- **Focus**: User experience, cross-browser compatibility
- **Tools**: Playwright
- **Run**: `npm run test:e2e`

#### Key Test Areas:
- Complete user workflows
- Mobile responsiveness
- Keyboard navigation
- Error scenarios in real browsers

### 4. Performance Tests
- **Coverage**: Speed and efficiency metrics
- **Focus**: Response times, memory usage, scalability
- **Tools**: Jest with performance timing
- **Run**: `npm run test:performance`

#### Key Test Areas:
- QR generation with varying data sizes
- Video frame processing performance
- Storage operation efficiency
- UI responsiveness under load

### 5. Security Tests
- **Coverage**: Vulnerability prevention
- **Focus**: XSS prevention, input validation, data sanitization
- **Tools**: Jest with security-focused assertions
- **Run**: `npm run test:security`

#### Key Test Areas:
- XSS injection attempts
- Malicious input handling
- Data validation and sanitization
- DOM manipulation security

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Categories
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only
npm run test:performance   # Performance tests only
npm run test:security      # Security tests only
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
- Environment: JSDOM for browser simulation
- Setup: Comprehensive mocks for browser APIs
- Coverage: 80% threshold for all metrics
- Timeout: 10 seconds for complex operations

### Playwright Configuration
- Browsers: Chromium, Firefox, WebKit
- Viewports: Desktop and mobile sizes  
- Screenshots: On test failures
- Videos: On test retries

## Mock Implementations

### QR Libraries Mock (`tests/mocks/qr-libraries.js`)
- Simulates QRCode.js and jsQR behavior
- Provides realistic QR generation and detection
- Supports different error correction levels
- Includes performance characteristics

### Camera API Mock (`tests/mocks/camera-api.js`)
- Complete MediaDevices API simulation
- Permission handling scenarios
- Video stream management
- Error condition simulation

### Storage API Mock (`tests/mocks/storage-api.js`)
- Full localStorage/sessionStorage implementation
- Quota management and errors
- Data integrity validation
- Cross-tab event simulation

## Test Data Generation

### TestDataFactory (`tests/fixtures/test-data-factory.js`)
Generates consistent test data including:
- Text of various sizes and character sets
- Session data with proper structure
- QR code configuration objects
- Image data for camera simulation
- Malicious input patterns for security testing

### TestScenarios (`tests/fixtures/test-scenarios.js`)
Pre-defined scenarios for:
- Basic functionality testing
- Performance benchmarking
- Security vulnerability testing
- E2E user workflows
- Error handling validation

## Performance Benchmarks

### QR Generation Performance
- Small data (100 chars): < 100ms
- Medium data (1KB): < 200ms  
- Large data (5KB): < 500ms
- Maximum data (10KB): < 1000ms

### QR Scanning Performance
- Frame processing: < 100ms per frame
- QR detection: < 50ms when code present
- Data processing: < 50ms for any size

### Storage Performance
- Save operation: < 50ms
- Load operation: < 20ms
- List sessions: < 100ms for 50+ sessions

## Security Test Coverage

### XSS Prevention
- Script tag injection
- Event handler injection
- HTML attribute breakout
- JavaScript protocol URLs
- Template injection attempts

### Input Validation
- Oversized data handling
- Special character processing
- Unicode validation
- Binary data handling
- Malformed input recovery

### Data Integrity
- Storage tampering prevention
- Prototype pollution protection
- DOM manipulation security
- Configuration validation

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all
      - uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

### Quality Gates
- All tests must pass
- Coverage must be > 80%
- Performance benchmarks must be met
- Security tests must show no vulnerabilities

## Troubleshooting

### Common Issues

#### Tests fail with "QRCode is not defined"
- Ensure mocks are properly imported in test files
- Check that setup.js is configured correctly

#### E2E tests timeout
- Increase timeout in playwright.config.js
- Check that HTML files are accessible at correct paths

#### Performance tests are flaky
- Run tests on consistent hardware
- Adjust thresholds based on CI environment

#### Camera tests fail
- Ensure proper mock configuration
- Check browser permission settings for local files

### Debug Mode
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/sender.test.js

# Debug E2E tests
npx playwright test --debug
```

## Contributing

### Adding New Tests
1. Choose appropriate test category
2. Use existing mocks and fixtures
3. Follow naming conventions
4. Include performance assertions
5. Add security considerations
6. Update documentation

### Test Naming Convention
- Describe behavior, not implementation
- Use "should" statements
- Be specific about conditions
- Group related tests in describe blocks

Example:
```javascript
describe('QR Code Generation', () => {
  test('should generate QR code for valid text input', () => {
    // Test implementation
  });
  
  test('should show warning for empty input', () => {
    // Test implementation  
  });
});
```

This comprehensive test suite ensures the QR Data Transfer System is robust, secure, and performant across all supported environments and use cases.