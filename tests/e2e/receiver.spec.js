// E2E tests for QR Data Receiver functionality

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('QR Data Receiver E2E', () => {
  const receiverPath = path.resolve(__dirname, '../../receiver.html');
  
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${receiverPath}`);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for JavaScript to initialize
    await page.waitForFunction(() => window.qrReceiver !== undefined);
    
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
  });

  test('should load receiver page with all UI elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('QR数据接收器 - 扫描接收数据');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('QR数据接收器');
    
    // Check camera section
    await expect(page.locator('#videoElement')).toBeVisible();
    await expect(page.locator('.camera-overlay')).toBeVisible();
    
    // Check control buttons
    await expect(page.locator('#startCameraBtn')).toBeVisible();
    await expect(page.locator('#stopCameraBtn')).toBeVisible();
    await expect(page.locator('#resetBtn')).toBeVisible();
    
    // Check other UI elements
    await expect(page.locator('#receivedData')).toBeVisible();
    await expect(page.locator('#copyBtn')).toBeVisible();
    await expect(page.locator('#saveToStorageBtn')).toBeVisible();
    
    // Check initial status
    await expect(page.locator('.status')).toContainText('准备扫描二维码');
  });

  test('should have correct initial state', async ({ page }) => {
    // Check initial button states
    await expect(page.locator('#startCameraBtn')).not.toBeDisabled();
    await expect(page.locator('#stopCameraBtn')).toBeDisabled();
    
    // Check sections visibility
    await expect(page.locator('#progressSection')).toBeHidden();
    await expect(page.locator('#resultsSection')).toBeHidden();
    await expect(page.locator('#storedDataSection')).toBeHidden();
    
    // Check empty received data
    await expect(page.locator('#receivedData')).toHaveValue('');
    
    // Check progress elements
    await expect(page.locator('#progressFill')).toHaveCSS('width', '0px');
    await expect(page.locator('#progressText')).toContainText('等待二维码...');
  });

  test('should simulate QR data processing without camera', async ({ page }) => {
    // Simulate receiving QR data by calling the method directly
    const testData = 'Simulated QR data from E2E test';
    
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    // Check that data is processed
    await expect(page.locator('#receivedData')).toHaveValue(testData);
    await expect(page.locator('#resultsSection')).toBeVisible();
    
    // Check progress update
    await expect(page.locator('#progressFill')).toHaveCSS('width', /100%/);
    await expect(page.locator('#progressText')).toContainText('传输完成');
    
    // Check status message
    await expect(page.locator('.status')).toContainText('数据接收成功');
  });

  test('should handle duplicate QR data correctly', async ({ page }) => {
    const testData = 'Duplicate test data';
    
    // Process same data twice
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    // Wait a bit then try again
    await page.waitForTimeout(500);
    
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    // Should only process once - check scan count
    const scanCount = await page.evaluate(() => window.qrReceiver.scanCount);
    expect(scanCount).toBe(1);
  });

  test('should copy data to clipboard', async ({ page }) => {
    const testData = 'Copy to clipboard test';
    
    // Simulate QR data processing
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    // Mock clipboard API for testing
    await page.addInitScript(() => {
      window.clipboardData = '';
      navigator.clipboard = {
        writeText: async (text) => {
          window.clipboardData = text;
          return Promise.resolve();
        }
      };
    });
    
    // Click copy button
    await page.locator('#copyBtn').click();
    
    // Check clipboard was called
    const clipboardData = await page.evaluate(() => window.clipboardData);
    expect(clipboardData).toBe(testData);
    
    // Check status message
    await expect(page.locator('.status')).toContainText('数据已复制到剪贴板');
  });

  test('should save data to localStorage', async ({ page }) => {
    const testData = 'Save to storage test';
    
    // Process QR data (which auto-saves)
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    // Check that data was auto-saved
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(storageKeys.length).toBe(1);
    expect(storageKeys[0]).toMatch(/^session_\d+$/);
    
    // Check stored data content
    const storedData = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key));
    }, storageKeys[0]);
    
    expect(storedData.data).toBe(testData);
    expect(storedData.type).toBe('text');
    expect(storedData.size).toBe(testData.length);
    
    // Should also show stored data section
    await expect(page.locator('#storedDataSection')).toBeVisible();
  });

  test('should handle manual save to storage', async ({ page }) => {
    const testData = 'Manual save test';
    
    // Manually enter data
    await page.locator('#receivedData').fill(testData);
    
    // Make results section visible
    await page.locator('#resultsSection').evaluate(el => el.style.display = 'block');
    
    // Click manual save
    await page.locator('#saveToStorageBtn').click();
    
    // Check storage
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    const manualKey = storageKeys.find(key => key.startsWith('manual_'));
    expect(manualKey).toBeDefined();
    
    const storedData = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key));
    }, manualKey);
    
    expect(storedData.data).toBe(testData);
    expect(storedData.manual).toBe(true);
  });

  test('should warn when trying to save empty data', async ({ page }) => {
    // Try to save without data
    await page.locator('#saveToStorageBtn').click();
    
    // Check warning message
    await expect(page.locator('.status.warning')).toContainText('没有数据可保存');
    
    // Check no storage occurred
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(storageKeys.length).toBe(0);
  });

  test('should load and display stored sessions', async ({ page }) => {
    // Add test data to localStorage
    await page.evaluate(() => {
      const session1 = {
        id: 'session_123',
        timestamp: '2024-01-01T10:00:00Z',
        type: 'text',
        data: 'Stored data 1',
        size: 13
      };
      const session2 = {
        id: 'manual_456',
        timestamp: '2024-01-02T10:00:00Z',
        type: 'text',
        data: 'Manual data 2',
        size: 13,
        manual: true
      };
      
      localStorage.setItem('session_123', JSON.stringify(session1));
      localStorage.setItem('manual_456', JSON.stringify(session2));
    });
    
    // Reload stored sessions
    await page.evaluate(() => window.qrReceiver.loadStoredSessions());
    
    // Check stored data section is visible
    await expect(page.locator('#storedDataSection')).toBeVisible();
    
    // Check session items are displayed
    await expect(page.locator('.frame-item')).toHaveCount(2);
    await expect(page.locator('.frame-item').first()).toContainText('manual_456');
    await expect(page.locator('.frame-item').nth(1)).toContainText('session_123');
  });

  test('should load specific session', async ({ page }) => {
    const testData = 'Load session test data';
    
    // Add session to localStorage
    await page.evaluate((data) => {
      const session = {
        id: 'session_load_test',
        timestamp: new Date().toISOString(),
        type: 'text',
        data: data,
        size: data.length
      };
      localStorage.setItem('session_load_test', JSON.stringify(session));
    }, testData);
    
    // Load the session
    await page.evaluate(() => {
      window.qrReceiver.loadSession('session_load_test');
    });
    
    // Check data was loaded
    await expect(page.locator('#receivedData')).toHaveValue(testData);
    await expect(page.locator('#resultsSection')).toBeVisible();
  });

  test('should delete specific session', async ({ page }) => {
    // Add session to localStorage
    await page.evaluate(() => {
      const session = {
        id: 'session_delete_test',
        timestamp: new Date().toISOString(),
        type: 'text',
        data: 'Delete test data',
        size: 16
      };
      localStorage.setItem('session_delete_test', JSON.stringify(session));
    });
    
    // Mock confirm dialog
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    
    // Delete session
    await page.evaluate(() => {
      window.qrReceiver.deleteSession('session_delete_test');
    });
    
    // Check session was deleted
    const sessionData = await page.evaluate(() => 
      localStorage.getItem('session_delete_test')
    );
    expect(sessionData).toBe(null);
  });

  test('should clear all storage', async ({ page }) => {
    // Add multiple sessions
    await page.evaluate(() => {
      localStorage.setItem('session_1', JSON.stringify({ id: 'session_1' }));
      localStorage.setItem('manual_1', JSON.stringify({ id: 'manual_1' }));
      localStorage.setItem('other_key', 'should remain'); // Should not be cleared
    });
    
    // Mock confirm dialog
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    
    // Clear all storage
    await page.evaluate(() => {
      window.qrReceiver.clearAllStorage();
    });
    
    // Check QR sessions were cleared but other keys remain
    const session1 = await page.evaluate(() => localStorage.getItem('session_1'));
    const manual1 = await page.evaluate(() => localStorage.getItem('manual_1'));
    const otherKey = await page.evaluate(() => localStorage.getItem('other_key'));
    
    expect(session1).toBe(null);
    expect(manual1).toBe(null);
    expect(otherKey).toBe('should remain');
  });

  test('should reset session state', async ({ page }) => {
    const testData = 'Reset test data';
    
    // Set up some session state
    await page.evaluate((data) => {
      const receiver = window.qrReceiver;
      receiver.receivedFrames.set('frame1', 'data1');
      receiver.totalFrames = 5;
      receiver.sessionId = 'test_session';
      receiver.lastScannedData = 'old_data';
      receiver.scanCount = 10;
      receiver.processQRCode(data);
    }, testData);
    
    // Check state is set
    await expect(page.locator('#receivedData')).toHaveValue(testData);
    await expect(page.locator('#resultsSection')).toBeVisible();
    
    // Reset session
    await page.locator('#resetBtn').click();
    
    // Check state is reset
    await expect(page.locator('#receivedData')).toHaveValue('');
    await expect(page.locator('#resultsSection')).toBeHidden();
    await expect(page.locator('#progressFill')).toHaveCSS('width', '0px');
    await expect(page.locator('#progressText')).toContainText('等待二维码');
    
    // Check internal state
    const scanCount = await page.evaluate(() => window.qrReceiver.scanCount);
    expect(scanCount).toBe(0);
  });

  test('should handle unicode and special characters', async ({ page }) => {
    const unicodeData = '你好世界 🌍 Héllo Wörld! ñiño €100 ‰ ∑ ∞';
    
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, unicodeData);
    
    // Check unicode data is handled correctly
    await expect(page.locator('#receivedData')).toHaveValue(unicodeData);
    
    // Check storage preserves unicode
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    const storedData = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key));
    }, storageKeys[0]);
    
    expect(storedData.data).toBe(unicodeData);
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check elements are still visible
    await expect(page.locator('#videoElement')).toBeVisible();
    await expect(page.locator('#startCameraBtn')).toBeVisible();
    await expect(page.locator('.camera-overlay')).toBeVisible();
    
    // Check camera overlay is properly sized for mobile
    const overlay = page.locator('.camera-overlay');
    await expect(overlay).toBeVisible();
    
    // Process QR data on mobile
    const testData = 'Mobile test data';
    await page.evaluate((data) => {
      window.qrReceiver.processQRCode(data);
    }, testData);
    
    await expect(page.locator('#receivedData')).toHaveValue(testData);
    await expect(page.locator('#resultsSection')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through buttons
    await page.keyboard.press('Tab');
    await expect(page.locator('#startCameraBtn')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#stopCameraBtn')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#resetBtn')).toBeFocused();
    
    // Test enter key on reset button
    await page.keyboard.press('Enter');
    
    // Should trigger reset (check status message)
    await expect(page.locator('.status')).toContainText('会话已重置');
  });

  test('should display status messages with auto-hide', async ({ page }) => {
    // Process QR data to trigger status message
    await page.evaluate(() => {
      window.qrReceiver.showStatus('Test info message', 'info');
    });
    
    // Check message is displayed
    await expect(page.locator('.status.info')).toContainText('Test info message');
    
    // Wait for auto-hide (5 seconds + buffer)
    await page.waitForTimeout(5500);
    
    // Check message is hidden/changed
    await expect(page.locator('.status')).toContainText('准备扫描');
  });

  test('should not auto-hide error messages', async ({ page }) => {
    // Show error message
    await page.evaluate(() => {
      window.qrReceiver.showStatus('Test error message', 'error');
    });
    
    // Check message is displayed
    await expect(page.locator('.status.error')).toContainText('Test error message');
    
    // Wait for auto-hide time
    await page.waitForTimeout(5500);
    
    // Error message should still be visible
    await expect(page.locator('.status.error')).toContainText('Test error message');
  });
});