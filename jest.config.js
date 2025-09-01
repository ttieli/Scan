module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    '**/sender.html',
    '**/receiver.html',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Module name mapping for mocking browser APIs
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Transform files (for HTML parsing if needed)
  transform: {
    '^.+\\.html$': '<rootDir>/tests/htmlTransformer.js'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Globals for JSDOM environment
  testEnvironmentOptions: {
    url: 'https://localhost:3000'
  }
};