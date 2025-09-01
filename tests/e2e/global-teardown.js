// Global teardown for Playwright E2E tests

async function globalTeardown(config) {
  console.log('Cleaning up E2E test environment...');
  
  // Clean up any global resources if needed
  // For now, just log completion
  
  console.log('E2E test environment cleaned up ✓');
}

module.exports = globalTeardown;