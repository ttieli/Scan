// E2E tests for QR Data Sender functionality

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('QR Data Sender E2E', () => {
  const senderPath = path.resolve(__dirname, '../../sender.html');
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${senderPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for JavaScript to initialize
    await page.waitForFunction(() => window.qrSender !== undefined);
  });

  test('should load sender page with all UI elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('QR数据发送器 - 内网数据传输');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('QR数据发送器');
    
    // Check input elements
    await expect(page.locator('#textInput')).toBeVisible();
    await expect(page.locator('#fileInput')).toBeVisible();
    
    // Check control buttons
    await expect(page.locator('#generateBtn')).toBeVisible();
    await expect(page.locator('#clearBtn')).toBeVisible();
    await expect(page.locator('#playBtn')).toBeVisible();
    await expect(page.locator('#pauseBtn')).toBeVisible();
    await expect(page.locator('#stopBtn')).toBeVisible();
    
    // Check QR display area
    await expect(page.locator('#qrDisplay')).toBeVisible();
    await expect(page.locator('#qrDisplay')).toContainText('二维码将在此显示');
    
    // Check settings section
    await expect(page.locator('#intervalInput')).toBeVisible();
    await expect(page.locator('#qrSizeInput')).toBeVisible();
  });

  test('should have correct initial state', async ({ page }) => {
    // Check initial button states
    await expect(page.locator('#playBtn')).toBeDisabled();
    await expect(page.locator('#pauseBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
    
    // Check initial input values
    await expect(page.locator('#textInput')).toHaveValue(/Hello World/); // Default test text
    await expect(page.locator('#intervalInput')).toHaveValue('1500');
    await expect(page.locator('#qrSizeInput')).toHaveValue('256');
    
    // Check initial displays
    await expect(page.locator('#intervalDisplay')).toContainText('1500ms');
    await expect(page.locator('#qrSizeDisplay')).toContainText('256px');
    
    // Check progress section is hidden
    await expect(page.locator('#progressSection')).toBeHidden();
  });

  test('should generate QR code from text input', async ({ page }) => {
    const testText = 'Hello, Playwright E2E Test!';
    
    // Clear and enter test text
    await page.locator('#textInput').fill(testText);
    
    // Click generate button
    await page.locator('#generateBtn').click();
    
    // Wait for QR code to be generated
    await page.waitForSelector('#qrDisplay canvas', { timeout: 5000 });
    
    // Check that QR canvas is created
    const canvas = page.locator('#qrDisplay canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const canvasWidth = await canvas.getAttribute('width');
    const canvasHeight = await canvas.getAttribute('height');
    expect(canvasWidth).toBe('256');
    expect(canvasHeight).toBe('256');
    
    // Check that playback buttons are enabled
    await expect(page.locator('#playBtn')).not.toBeDisabled();
    await expect(page.locator('#pauseBtn')).not.toBeDisabled();
    await expect(page.locator('#stopBtn')).not.toBeDisabled();
    
    // Check status message
    await expect(page.locator('.status')).toContainText(/二维码生成成功/);
  });

  test('should show warning for empty input', async ({ page }) => {
    // Clear text input
    await page.locator('#textInput').fill('');
    
    // Click generate button
    await page.locator('#generateBtn').click();
    
    // Check for warning message
    await expect(page.locator('.status.warning')).toContainText('请输入要传输的文本');
    
    // Check that no QR code is generated
    await expect(page.locator('#qrDisplay canvas')).not.toBeVisible();
    
    // Check that playback buttons remain disabled
    await expect(page.locator('#playBtn')).toBeDisabled();
  });

  test('should update settings correctly', async ({ page }) => {
    // Test interval setting
    await page.locator('#intervalInput').fill('2500');
    await expect(page.locator('#intervalDisplay')).toContainText('2500ms');
    
    // Test QR size setting
    await page.locator('#qrSizeInput').fill('512');
    await expect(page.locator('#qrSizeDisplay')).toContainText('512px');
    
    // Generate QR with new settings
    await page.locator('#textInput').fill('Settings test');
    await page.locator('#generateBtn').click();
    
    await page.waitForSelector('#qrDisplay canvas');
    
    // Check that canvas has new size
    const canvas = page.locator('#qrDisplay canvas');
    const canvasWidth = await canvas.getAttribute('width');
    const canvasHeight = await canvas.getAttribute('height');
    expect(canvasWidth).toBe('512');
    expect(canvasHeight).toBe('512');
  });

  test('should handle playback controls', async ({ page }) => {
    // Generate QR code first
    await page.locator('#textInput').fill('Playback test');
    await page.locator('#generateBtn').click();
    await page.waitForSelector('#qrDisplay canvas');
    
    // Test play button
    await page.locator('#playBtn').click();
    
    // Check button states after play
    await expect(page.locator('#playBtn')).toBeDisabled();
    await expect(page.locator('#pauseBtn')).not.toBeDisabled();
    
    // Check progress section is visible
    await expect(page.locator('#progressSection')).toBeVisible();
    await expect(page.locator('#progressText')).toContainText('帧 1 / 1');
    
    // Test pause button
    await page.locator('#pauseBtn').click();
    
    // Check button states after pause
    await expect(page.locator('#playBtn')).not.toBeDisabled();
    await expect(page.locator('#pauseBtn')).toBeDisabled();
    
    // Test stop button
    await page.locator('#stopBtn').click();
    
    // Check states after stop
    await expect(page.locator('#progressSection')).toBeHidden();
    await expect(page.locator('#qrDisplay')).toContainText('播放已停止');
  });

  test('should clear all data', async ({ page }) => {
    // Set up some data
    await page.locator('#textInput').fill('Clear test data');
    await page.locator('#generateBtn').click();
    await page.waitForSelector('#qrDisplay canvas');
    
    // Click clear button
    await page.locator('#clearBtn').click();
    
    // Check that everything is cleared
    await expect(page.locator('#textInput')).toHaveValue('');
    await expect(page.locator('#qrDisplay')).toContainText('二维码将在此显示');
    await expect(page.locator('#progressSection')).toBeHidden();
    
    // Check button states
    await expect(page.locator('#playBtn')).toBeDisabled();
    await expect(page.locator('#pauseBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('should handle large text input', async ({ page }) => {
    // Create large text (around 2KB)
    const largeText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50);
    
    await page.locator('#textInput').fill(largeText);
    await page.locator('#generateBtn').click();
    
    // Should still generate QR code for large text
    await page.waitForSelector('#qrDisplay canvas', { timeout: 10000 });
    await expect(page.locator('#qrDisplay canvas')).toBeVisible();
    
    // Check success status
    await expect(page.locator('.status')).toContainText(/二维码生成成功/);
  });

  test('should handle special characters and unicode', async ({ page }) => {
    const unicodeText = '你好世界 🌍 Héllo Wörld! ñiño €100 ‰ ∑';
    
    await page.locator('#textInput').fill(unicodeText);
    await page.locator('#generateBtn').click();
    
    await page.waitForSelector('#qrDisplay canvas');
    await expect(page.locator('#qrDisplay canvas')).toBeVisible();
    
    // Check that the text is preserved in the input
    await expect(page.locator('#textInput')).toHaveValue(unicodeText);
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that elements are still visible and functional
    await expect(page.locator('#textInput')).toBeVisible();
    await expect(page.locator('#generateBtn')).toBeVisible();
    
    // Test QR generation on mobile
    await page.locator('#textInput').fill('Mobile test');
    await page.locator('#generateBtn').click();
    
    await page.waitForSelector('#qrDisplay canvas');
    await expect(page.locator('#qrDisplay canvas')).toBeVisible();
    
    // Check that controls are properly arranged
    await expect(page.locator('.controls')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('#textInput')).toBeFocused();
    
    await page.keyboard.press('Tab');
    // Skip file input as it may not be focusable
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('#generateBtn')).toBeFocused();
    
    // Test enter key on generate button
    await page.locator('#textInput').fill('Keyboard test');
    await page.keyboard.press('Enter');
    
    // Should generate QR code
    await page.waitForSelector('#qrDisplay canvas');
    await expect(page.locator('#qrDisplay canvas')).toBeVisible();
  });

  test('should maintain state during page interactions', async ({ page }) => {
    // Set up initial state
    await page.locator('#intervalInput').fill('3000');
    await page.locator('#qrSizeInput').fill('384');
    await page.locator('#textInput').fill('State test');
    
    // Generate QR
    await page.locator('#generateBtn').click();
    await page.waitForSelector('#qrDisplay canvas');
    
    // Start playback
    await page.locator('#playBtn').click();
    
    // Check that all states are maintained
    await expect(page.locator('#intervalInput')).toHaveValue('3000');
    await expect(page.locator('#qrSizeInput')).toHaveValue('384');
    await expect(page.locator('#textInput')).toHaveValue('State test');
    await expect(page.locator('#playBtn')).toBeDisabled();
    await expect(page.locator('#progressSection')).toBeVisible();
    
    // Test clearing state
    await page.locator('#clearBtn').click();
    
    // Check state is properly reset
    await expect(page.locator('#textInput')).toHaveValue('');
    await expect(page.locator('#playBtn')).toBeDisabled();
    await expect(page.locator('#progressSection')).toBeHidden();
    
    // But settings should be preserved
    await expect(page.locator('#intervalInput')).toHaveValue('3000');
    await expect(page.locator('#qrSizeInput')).toHaveValue('384');
  });
});