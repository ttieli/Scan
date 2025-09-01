// Global setup for Playwright E2E tests

const { chromium } = require('@playwright/test');
const path = require('path');

async function globalSetup(config) {
  console.log('Setting up E2E test environment...');
  
  // Create a browser instance to verify basic functionality
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Get the absolute paths to HTML files
    const senderPath = path.resolve(__dirname, '../../sender.html');
    const receiverPath = path.resolve(__dirname, '../../receiver.html');
    
    // Test that files can be loaded
    await page.goto(`file://${senderPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    const title = await page.title();
    console.log(`✓ Sender page loaded: ${title}`);
    
    await page.goto(`file://${receiverPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    const receiverTitle = await page.title();
    console.log(`✓ Receiver page loaded: ${receiverTitle}`);
    
    // Verify essential elements exist
    const senderElements = await page.goto(`file://${senderPath}`) && await Promise.all([
      page.waitForSelector('#textInput'),
      page.waitForSelector('#generateBtn'),
      page.waitForSelector('#qrDisplay')
    ]);
    console.log('✓ Sender essential elements found');
    
    await page.goto(`file://${receiverPath}`);
    const receiverElements = await Promise.all([
      page.waitForSelector('#videoElement'),
      page.waitForSelector('#startCameraBtn'),
      page.locator('#receivedData').waitFor({ state: 'attached' }) // Just check it exists, not visible
    ]);
    console.log('✓ Receiver essential elements found');
    
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('E2E test environment ready ✓');
}

module.exports = globalSetup;