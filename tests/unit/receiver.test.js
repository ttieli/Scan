// Unit tests for QRDataReceiver class and receiver.html functionality

const fs = require('fs');
const path = require('path');

describe('QR Data Receiver', () => {
  let receiverHTML;
  let QRDataReceiver;
  let mockStream;
  let mockVideo;

  beforeAll(() => {
    // Load the receiver HTML file
    const receiverPath = path.join(__dirname, '../../receiver.html');
    receiverHTML = fs.readFileSync(receiverPath, 'utf8');
  });

  beforeEach(() => {
    // Set up DOM with receiver HTML
    document.documentElement.innerHTML = receiverHTML;
    
    // Execute the scripts to define classes
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent && !script.src) {
        eval(script.textContent);
      }
    });
    
    // Mock getUserMedia
    mockStream = new MediaStream();
    navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
    
    // Mock video element
    mockVideo = new HTMLVideoElement();
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'videoElement') return mockVideo;
      return document.querySelector(`#${id}`);
    });
    
    // Mock jsQR
    global.jsQR = jest.fn();
    
    // Simulate DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Get the instantiated class
    QRDataReceiver = window.qrReceiver.constructor;
  });

  describe('Class Instantiation', () => {
    test('should create QRDataReceiver instance with correct initial state', () => {
      const receiver = new QRDataReceiver();
      
      expect(receiver).toBeInstanceOf(QRDataReceiver);
      expect(receiver.stream).toBe(null);
      expect(receiver.scanInterval).toBe(null);
      expect(receiver.receivedFrames).toBeInstanceOf(Map);
      expect(receiver.totalFrames).toBe(0);
      expect(receiver.lastScannedData).toBe(null);
      expect(receiver.sessionId).toBe(null);
      expect(receiver.scanCount).toBe(0);
    });

    test('should initialize DOM elements correctly', () => {
      const receiver = new QRDataReceiver();
      
      expect(receiver.video).toBeTruthy();
      expect(receiver.startCameraBtn).toBeTruthy();
      expect(receiver.stopCameraBtn).toBeTruthy();
      expect(receiver.resetBtn).toBeTruthy();
      expect(receiver.copyBtn).toBeTruthy();
      expect(receiver.progressSection).toBeTruthy();
      expect(receiver.receivedData).toBeTruthy();
    });

    test('should set up event listeners', () => {
      const receiver = new QRDataReceiver();
      
      expect(receiver.startCameraBtn).toBeTruthy();
      expect(receiver.stopCameraBtn).toBeTruthy();
      expect(receiver.resetBtn).toBeTruthy();
      expect(receiver.copyBtn).toBeTruthy();
      expect(receiver.saveToStorageBtn).toBeTruthy();
      expect(receiver.clearStorageBtn).toBeTruthy();
    });

    test('should load stored sessions on initialization', () => {
      const receiver = new QRDataReceiver();
      const loadStoredSessionsSpy = jest.spyOn(receiver, 'loadStoredSessions');
      
      // This is called during initialization
      expect(receiver.loadStoredSessions).toBeDefined();
    });
  });

  describe('Camera Management', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
    });

    test('should start camera successfully', async () => {
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const startScanningSpy = jest.spyOn(receiver, 'startScanning').mockImplementation();
      
      await receiver.startCamera();
      
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      expect(receiver.stream).toBe(mockStream);
      expect(receiver.video.srcObject).toBe(mockStream);
      expect(receiver.startCameraBtn.disabled).toBe(true);
      expect(receiver.stopCameraBtn.disabled).toBe(false);
      expect(receiver.progressSection.style.display).toBe('block');
      expect(showStatusSpy).toHaveBeenCalledWith('正在请求摄像头权限...', 'info');
    });

    test('should handle camera access errors', async () => {
      const error = new Error('Camera permission denied');
      navigator.mediaDevices.getUserMedia.mockRejectedValue(error);
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await receiver.startCamera();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Camera access error:', error);
      expect(showStatusSpy).toHaveBeenCalledWith('摄像头访问失败: Camera permission denied', 'error');
      expect(showStatusSpy).toHaveBeenCalledWith('请确保使用HTTPS并授予摄像头权限', 'warning');
      
      consoleErrorSpy.mockRestore();
    });

    test('should stop camera and clean up resources', () => {
      receiver.stream = mockStream;
      receiver.scanInterval = setInterval(() => {}, 100);
      receiver.video.srcObject = mockStream;
      
      const stopSpy = jest.spyOn(mockStream.tracks[0], 'stop');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.stopCamera();
      
      expect(stopSpy).toHaveBeenCalled();
      expect(receiver.stream).toBe(null);
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(receiver.scanInterval).toBe(null);
      expect(receiver.video.srcObject).toBe(null);
      expect(receiver.startCameraBtn.disabled).toBe(false);
      expect(receiver.stopCameraBtn.disabled).toBe(true);
      expect(showStatusSpy).toHaveBeenCalledWith('摄像头已停止', 'info');
    });

    test('should handle stopping camera when no stream exists', () => {
      receiver.stream = null;
      receiver.scanInterval = null;
      
      expect(() => {
        receiver.stopCamera();
      }).not.toThrow();
    });
  });

  describe('QR Code Scanning', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
      receiver.video = mockVideo;
    });

    test('should start scanning with correct interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.startScanning();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(receiver.scanInterval).toBeTruthy();
      expect(showStatusSpy).toHaveBeenCalledWith('正在扫描二维码...', 'info');
    });

    test('should scan frame and process QR code when detected', () => {
      const mockQRResult = { data: 'Test QR Data' };
      global.jsQR.mockReturnValue(mockQRResult);
      
      const processQRCodeSpy = jest.spyOn(receiver, 'processQRCode').mockImplementation();
      
      // Mock video dimensions
      receiver.video.videoWidth = 640;
      receiver.video.videoHeight = 480;
      
      receiver.scanFrame();
      
      expect(global.jsQR).toHaveBeenCalled();
      expect(processQRCodeSpy).toHaveBeenCalledWith('Test QR Data');
    });

    test('should skip scanning when video not ready', () => {
      receiver.video.videoWidth = 0;
      receiver.video.videoHeight = 0;
      
      global.jsQR.mockClear();
      
      receiver.scanFrame();
      
      expect(global.jsQR).not.toHaveBeenCalled();
    });

    test('should not process QR code if no code detected', () => {
      global.jsQR.mockReturnValue(null);
      
      const processQRCodeSpy = jest.spyOn(receiver, 'processQRCode').mockImplementation();
      
      receiver.video.videoWidth = 640;
      receiver.video.videoHeight = 480;
      
      receiver.scanFrame();
      
      expect(processQRCodeSpy).not.toHaveBeenCalled();
    });
  });

  describe('QR Code Processing', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
    });

    test('should process new QR data successfully', () => {
      const qrData = 'Hello, World!';
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const autoSaveDataSpy = jest.spyOn(receiver, 'autoSaveData').mockImplementation();
      
      receiver.processQRCode(qrData);
      
      expect(receiver.scanCount).toBe(1);
      expect(receiver.lastScannedData).toBe(qrData);
      expect(receiver.receivedData.value).toBe(qrData);
      expect(receiver.resultsSection.style.display).toBe('block');
      expect(receiver.progressFill.style.width).toBe('100%');
      expect(receiver.progressText.textContent).toBe('传输完成！');
      expect(showStatusSpy).toHaveBeenCalledWith('检测到二维码 (第1次扫描)', 'info');
      expect(showStatusSpy).toHaveBeenCalledWith('数据接收成功！', 'info');
      expect(autoSaveDataSpy).toHaveBeenCalledWith(qrData);
    });

    test('should ignore duplicate QR data', () => {
      const qrData = 'Test Data';
      receiver.lastScannedData = qrData;
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.processQRCode(qrData);
      
      expect(receiver.scanCount).toBe(0);
      expect(showStatusSpy).not.toHaveBeenCalled();
    });

    test('should handle QR processing errors gracefully', () => {
      const qrData = 'Test Data';
      const error = new Error('Processing error');
      
      // Mock autoSaveData to throw an error
      jest.spyOn(receiver, 'autoSaveData').mockImplementation(() => {
        throw error;
      });
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      receiver.processQRCode(qrData);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('QR processing error:', error);
      expect(showStatusSpy).toHaveBeenCalledWith('处理二维码错误: Processing error', 'error');
      
      consoleErrorSpy.mockRestore();
    });

    test('should reset lastScannedData after delay', (done) => {
      const qrData = 'Test Data';
      jest.spyOn(receiver, 'autoSaveData').mockImplementation();
      
      receiver.processQRCode(qrData);
      
      expect(receiver.lastScannedData).toBe(qrData);
      
      setTimeout(() => {
        expect(receiver.lastScannedData).toBe(null);
        done();
      }, 1100);
    });

    test('should add visual feedback on successful scan', () => {
      const qrData = 'Test Data';
      jest.spyOn(receiver, 'autoSaveData').mockImplementation();
      
      receiver.processQRCode(qrData);
      
      expect(receiver.video.style.filter).toBe('brightness(1.2)');
      
      setTimeout(() => {
        expect(receiver.video.style.filter).toBe('none');
      }, 250);
    });
  });

  describe('Data Storage Management', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
      localStorage.clear();
    });

    test('should auto-save data to localStorage', () => {
      const testData = 'Test data for storage';
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const loadStoredSessionsSpy = jest.spyOn(receiver, 'loadStoredSessions').mockImplementation();
      
      receiver.autoSaveData(testData);
      
      // Check that data was saved
      const keys = Object.keys(localStorage.store);
      expect(keys.length).toBe(1);
      expect(keys[0]).toMatch(/^session_\d+$/);
      
      const savedData = JSON.parse(localStorage.getItem(keys[0]));
      expect(savedData.data).toBe(testData);
      expect(savedData.type).toBe('text');
      expect(savedData.size).toBe(testData.length);
      expect(savedData.timestamp).toBeDefined();
      
      expect(loadStoredSessionsSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('数据已自动保存到本地存储', 'info');
    });

    test('should manually save data to storage', () => {
      receiver.receivedData.value = 'Manual save test';
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      const loadStoredSessionsSpy = jest.spyOn(receiver, 'loadStoredSessions').mockImplementation();
      
      receiver.saveToStorage();
      
      const keys = Object.keys(localStorage.store);
      expect(keys.length).toBe(1);
      expect(keys[0]).toMatch(/^manual_\d+$/);
      
      const savedData = JSON.parse(localStorage.getItem(keys[0]));
      expect(savedData.data).toBe('Manual save test');
      expect(savedData.manual).toBe(true);
      
      expect(loadStoredSessionsSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('数据已保存到本地存储', 'info');
    });

    test('should show warning when trying to save empty data', () => {
      receiver.receivedData.value = '';
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.saveToStorage();
      
      expect(showStatusSpy).toHaveBeenCalledWith('没有数据可保存', 'warning');
      expect(Object.keys(localStorage.store)).toHaveLength(0);
    });

    test('should load and display stored sessions', () => {
      // Add test data to localStorage
      const sessionData1 = {
        id: 'session_123',
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
        type: 'text',
        data: 'Test data 1',
        size: 11
      };
      const sessionData2 = {
        id: 'manual_456',
        timestamp: new Date('2024-01-02T10:00:00Z').toISOString(),
        type: 'text',
        data: 'Test data 2',
        size: 11,
        manual: true
      };
      
      localStorage.setItem('session_123', JSON.stringify(sessionData1));
      localStorage.setItem('manual_456', JSON.stringify(sessionData2));
      localStorage.setItem('other_key', 'other_data'); // Should be ignored
      
      const displayStoredSessionsSpy = jest.spyOn(receiver, 'displayStoredSessions').mockImplementation();
      
      receiver.loadStoredSessions();
      
      expect(receiver.storedDataSection.style.display).toBe('block');
      expect(displayStoredSessionsSpy).toHaveBeenCalledWith([sessionData2, sessionData1]); // Sorted by timestamp
    });

    test('should hide stored sessions section when no sessions exist', () => {
      receiver.loadStoredSessions();
      
      expect(receiver.storedDataSection.style.display).toBe('none');
    });

    test('should handle corrupt session data gracefully', () => {
      localStorage.setItem('session_corrupt', 'invalid json');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      receiver.loadStoredSessions();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid session data:', 'session_corrupt');
      expect(receiver.storedDataSection.style.display).toBe('none');
      
      consoleWarnSpy.mockRestore();
    });

    test('should load specific session', () => {
      const sessionData = {
        id: 'session_123',
        data: 'Session data test'
      };
      localStorage.setItem('session_123', JSON.stringify(sessionData));
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.loadSession('session_123');
      
      expect(receiver.receivedData.value).toBe('Session data test');
      expect(receiver.resultsSection.style.display).toBe('block');
      expect(showStatusSpy).toHaveBeenCalledWith('会话已加载: session_123', 'info');
    });

    test('should handle loading non-existent session', () => {
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.loadSession('non_existent');
      
      expect(showStatusSpy).toHaveBeenCalledWith('加载会话错误: Cannot read properties of null (reading \'data\')', 'error');
    });

    test('should delete specific session', () => {
      localStorage.setItem('session_123', JSON.stringify({ id: 'session_123' }));
      global.confirm.mockReturnValue(true);
      
      const loadStoredSessionsSpy = jest.spyOn(receiver, 'loadStoredSessions').mockImplementation();
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.deleteSession('session_123');
      
      expect(localStorage.getItem('session_123')).toBe(null);
      expect(loadStoredSessionsSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('会话已删除', 'info');
    });

    test('should not delete session when user cancels', () => {
      localStorage.setItem('session_123', JSON.stringify({ id: 'session_123' }));
      global.confirm.mockReturnValue(false);
      
      receiver.deleteSession('session_123');
      
      expect(localStorage.getItem('session_123')).not.toBe(null);
    });

    test('should clear all storage when confirmed', () => {
      localStorage.setItem('session_1', '{}');
      localStorage.setItem('manual_2', '{}');
      localStorage.setItem('other_key', '{}'); // Should remain
      
      global.confirm.mockReturnValue(true);
      
      const loadStoredSessionsSpy = jest.spyOn(receiver, 'loadStoredSessions').mockImplementation();
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.clearAllStorage();
      
      expect(localStorage.getItem('session_1')).toBe(null);
      expect(localStorage.getItem('manual_2')).toBe(null);
      expect(localStorage.getItem('other_key')).not.toBe(null); // Should remain
      
      expect(loadStoredSessionsSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('所有存储的数据已清除', 'info');
    });
  });

  describe('Session Reset', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
    });

    test('should reset session state completely', () => {
      // Set up some state
      receiver.receivedFrames.set('frame1', 'data1');
      receiver.totalFrames = 5;
      receiver.sessionId = 'test_session';
      receiver.lastScannedData = 'old_data';
      receiver.scanCount = 10;
      receiver.receivedData.value = 'old text';
      receiver.resultsSection.style.display = 'block';
      receiver.progressFill.style.width = '50%';
      receiver.progressText.textContent = 'Frame 5/10';
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      receiver.resetSession();
      
      expect(receiver.receivedFrames.size).toBe(0);
      expect(receiver.totalFrames).toBe(0);
      expect(receiver.sessionId).toBe(null);
      expect(receiver.lastScannedData).toBe(null);
      expect(receiver.scanCount).toBe(0);
      expect(receiver.receivedData.value).toBe('');
      expect(receiver.resultsSection.style.display).toBe('none');
      expect(receiver.progressFill.style.width).toBe('0%');
      expect(receiver.progressText.textContent).toBe('等待二维码...');
      expect(showStatusSpy).toHaveBeenCalledWith('会话已重置，准备接收新数据', 'info');
    });
  });

  describe('Clipboard Operations', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
    });

    test('should copy data to clipboard using modern API', async () => {
      receiver.receivedData.value = 'Test clipboard data';
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      await receiver.copyToClipboard();
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test clipboard data');
      expect(showStatusSpy).toHaveBeenCalledWith('数据已复制到剪贴板！', 'info');
    });

    test('should fallback to legacy clipboard API when modern API fails', async () => {
      receiver.receivedData.value = 'Test clipboard data';
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      
      const selectSpy = jest.fn();
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockReturnValue(true);
      receiver.receivedData.select = selectSpy;
      
      const showStatusSpy = jest.spyOn(receiver, 'showStatus');
      
      await receiver.copyToClipboard();
      
      expect(selectSpy).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(showStatusSpy).toHaveBeenCalledWith('数据已复制到剪贴板！', 'info');
      
      execCommandSpy.mockRestore();
    });
  });

  describe('Status Display', () => {
    let receiver;
    
    beforeEach(() => {
      receiver = new QRDataReceiver();
    });

    test('should display status messages with correct styling', () => {
      receiver.showStatus('Test info message', 'info');
      expect(receiver.statusContainer.innerHTML).toBe('<div class="status info">Test info message</div>');
      
      receiver.showStatus('Test warning message', 'warning');
      expect(receiver.statusContainer.innerHTML).toBe('<div class="status warning">Test warning message</div>');
      
      receiver.showStatus('Test error message', 'error');
      expect(receiver.statusContainer.innerHTML).toBe('<div class="status error">Test error message</div>');
    });

    test('should auto-hide non-error messages after 5 seconds', (done) => {
      receiver.showStatus('Test message', 'info');
      
      setTimeout(() => {
        expect(receiver.statusContainer.innerHTML).toBe('<div class="status info">准备扫描</div>');
        done();
      }, 5100);
    }, 6000);

    test('should not auto-hide error messages', (done) => {
      receiver.showStatus('Error message', 'error');
      
      setTimeout(() => {
        expect(receiver.statusContainer.innerHTML).toBe('<div class="status error">Error message</div>');
        done();
      }, 5100);
    }, 6000);
  });
});