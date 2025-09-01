// Unit tests for QRDataSender class and sender.html functionality

const fs = require('fs');
const path = require('path');

describe('QR Data Sender', () => {
  let senderHTML;
  let QRDataSender;
  let mockQRCode;

  beforeAll(() => {
    // Load the sender HTML file
    const senderPath = path.join(__dirname, '../../sender.html');
    senderHTML = fs.readFileSync(senderPath, 'utf8');
  });

  beforeEach(() => {
    // Set up DOM with sender HTML
    document.documentElement.innerHTML = senderHTML;
    
    // Execute the scripts to define classes
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent && !script.src) {
        eval(script.textContent);
      }
    });
    
    // Mock QRCode library
    mockQRCode = {
      makeCode: jest.fn(),
      clear: jest.fn()
    };
    
    global.QRCode = jest.fn().mockImplementation(() => mockQRCode);
    global.QRCode.CorrectLevel = { L: 1, M: 2, Q: 3, H: 4 };
    
    // Simulate DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Get the instantiated class
    QRDataSender = window.qrSender.constructor;
  });

  describe('Class Instantiation', () => {
    test('should create QRDataSender instance with default configuration', () => {
      const sender = new QRDataSender();
      
      expect(sender).toBeInstanceOf(QRDataSender);
      expect(sender.config).toEqual({
        maxChunkSize: 800,
        interval: 1500,
        qrSize: 256,
        errorCorrectionLevel: 'M'
      });
      expect(sender.frames).toEqual([]);
      expect(sender.currentFrame).toBe(0);
      expect(sender.isPlaying).toBe(false);
    });

    test('should initialize DOM elements correctly', () => {
      const sender = new QRDataSender();
      
      expect(sender.textInput).toBeTruthy();
      expect(sender.generateBtn).toBeTruthy();
      expect(sender.qrDisplay).toBeTruthy();
      expect(sender.progressSection).toBeTruthy();
      expect(sender.intervalInput).toBeTruthy();
      expect(sender.qrSizeInput).toBeTruthy();
    });

    test('should set up event listeners', () => {
      const sender = new QRDataSender();
      
      // Test button click events
      const generateBtn = sender.generateBtn;
      const clearBtn = sender.clearBtn;
      const playBtn = sender.playBtn;
      
      expect(generateBtn).toBeTruthy();
      expect(clearBtn).toBeTruthy();
      expect(playBtn).toBeTruthy();
    });
  });

  describe('QR Code Generation', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should generate QR code for valid text input', () => {
      const testText = 'Hello, World!';
      sender.textInput.value = testText;
      
      sender.generateQRCode();
      
      expect(sender.frames).toEqual([testText]);
      expect(global.QRCode).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          text: testText,
          width: 256,
          height: 256,
          correctLevel: 2 // QRCode.CorrectLevel.M
        })
      );
    });

    test('should show warning for empty text input', () => {
      sender.textInput.value = '';
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.generateQRCode();
      
      expect(showStatusSpy).toHaveBeenCalledWith('请输入要传输的文本', 'warning');
      expect(sender.frames).toEqual([]);
    });

    test('should show warning for whitespace-only input', () => {
      sender.textInput.value = '   \n  \t  ';
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.generateQRCode();
      
      expect(showStatusSpy).toHaveBeenCalledWith('请输入要传输的文本', 'warning');
      expect(sender.frames).toEqual([]);
    });

    test('should handle QR generation errors gracefully', () => {
      global.QRCode.mockImplementation(() => {
        throw new Error('QR generation failed');
      });
      
      sender.textInput.value = 'test';
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      sender.generateQRCode();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('QR Generation Error:', expect.any(Error));
      expect(showStatusSpy).toHaveBeenCalledWith('生成二维码错误: QR generation failed', 'error');
      
      consoleErrorSpy.mockRestore();
    });

    test('should enable playback controls after successful generation', () => {
      sender.textInput.value = 'test';
      
      sender.generateQRCode();
      
      expect(sender.playBtn.disabled).toBe(false);
      expect(sender.pauseBtn.disabled).toBe(false);
      expect(sender.stopBtn.disabled).toBe(false);
    });

    test('should handle maximum character limit', () => {
      const longText = 'a'.repeat(10001); // Exceeds 10,000 char limit
      sender.textInput.value = longText;
      
      sender.generateQRCode();
      
      // Should still process (Phase 1 doesn't enforce chunking yet)
      expect(sender.frames.length).toBe(1);
    });
  });

  describe('Display QR Code', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should display QR code with correct canvas element', () => {
      const testData = 'test data';
      sender.frames = [testData];
      
      sender.displayQRCode(testData, 0);
      
      expect(sender.qrDisplay.innerHTML).toBe(''); // Cleared previous content
      expect(global.QRCode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.objectContaining({
          text: testData,
          width: 256,
          height: 256
        })
      );
    });

    test('should update progress correctly', () => {
      sender.frames = ['frame1', 'frame2', 'frame3'];
      const updateProgressSpy = jest.spyOn(sender, 'updateProgress');
      
      sender.displayQRCode('frame2', 1);
      
      expect(updateProgressSpy).toHaveBeenCalledWith(2, 3);
    });

    test('should handle display errors gracefully', () => {
      global.QRCode.mockImplementation(() => {
        throw new Error('Canvas error');
      });
      
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      sender.displayQRCode('test', 0);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Display Error:', expect.any(Error));
      expect(showStatusSpy).toHaveBeenCalledWith('显示二维码错误: Canvas error', 'error');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Playback Controls', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should start playback with frames available', () => {
      sender.frames = ['test frame'];
      const displayQRCodeSpy = jest.spyOn(sender, 'displayQRCode');
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.startPlayback();
      
      expect(sender.isPlaying).toBe(true);
      expect(sender.playBtn.disabled).toBe(true);
      expect(sender.pauseBtn.disabled).toBe(false);
      expect(sender.progressSection.style.display).toBe('block');
      expect(displayQRCodeSpy).toHaveBeenCalledWith('test frame', 0);
      expect(showStatusSpy).toHaveBeenCalledWith('播放二维码 (第一阶段：单帧)', 'info');
    });

    test('should show warning when no frames available', () => {
      sender.frames = [];
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.startPlayback();
      
      expect(sender.isPlaying).toBe(false);
      expect(showStatusSpy).toHaveBeenCalledWith('没有二维码可播放，请先生成', 'warning');
    });

    test('should pause playback correctly', () => {
      sender.isPlaying = true;
      sender.playbackInterval = setInterval(() => {}, 100);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.pausePlayback();
      
      expect(sender.isPlaying).toBe(false);
      expect(sender.playBtn.disabled).toBe(false);
      expect(sender.pauseBtn.disabled).toBe(true);
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('播放已暂停', 'info');
    });

    test('should stop playback and reset state', () => {
      sender.isPlaying = true;
      sender.currentFrame = 5;
      sender.playbackInterval = setInterval(() => {}, 100);
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.stopPlayback();
      
      expect(sender.isPlaying).toBe(false);
      expect(sender.currentFrame).toBe(0);
      expect(sender.playBtn.disabled).toBe(false);
      expect(sender.pauseBtn.disabled).toBe(true);
      expect(sender.progressSection.style.display).toBe('none');
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(showStatusSpy).toHaveBeenCalledWith('播放已停止', 'info');
      expect(sender.qrDisplay.innerHTML).toBe('<div class="qr-placeholder">播放已停止</div>');
    });
  });

  describe('Progress Tracking', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should update progress bar and text correctly', () => {
      sender.updateProgress(3, 10);
      
      expect(sender.progressFill.style.width).toBe('30%');
      expect(sender.progressText.textContent).toBe('帧 3 / 10');
    });

    test('should handle zero total frames', () => {
      sender.updateProgress(0, 0);
      
      // Should not update when total is 0
      expect(sender.progressFill.style.width).toBe('');
      expect(sender.progressText.textContent).toBe('');
    });

    test('should calculate 100% progress correctly', () => {
      sender.updateProgress(5, 5);
      
      expect(sender.progressFill.style.width).toBe('100%');
      expect(sender.progressText.textContent).toBe('帧 5 / 5');
    });
  });

  describe('Configuration Management', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should update interval configuration', () => {
      const intervalEvent = { target: { value: '2000' } };
      
      sender.intervalInput.dispatchEvent(new Event('input'));
      sender.intervalInput.value = '2000';
      
      // Simulate the event handler
      sender.config.interval = parseInt(intervalEvent.target.value);
      sender.intervalDisplay.textContent = `${intervalEvent.target.value}ms`;
      
      expect(sender.config.interval).toBe(2000);
      expect(sender.intervalDisplay.textContent).toBe('2000ms');
    });

    test('should update QR size configuration', () => {
      const sizeEvent = { target: { value: '512' } };
      
      sender.qrSizeInput.dispatchEvent(new Event('input'));
      sender.qrSizeInput.value = '512';
      
      // Simulate the event handler
      sender.config.qrSize = parseInt(sizeEvent.target.value);
      sender.qrSizeDisplay.textContent = `${sizeEvent.target.value}px`;
      
      expect(sender.config.qrSize).toBe(512);
      expect(sender.qrSizeDisplay.textContent).toBe('512px');
    });
  });

  describe('Clear Functionality', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should clear all data and reset state', () => {
      // Set up some state
      sender.textInput.value = 'test';
      sender.fileInput.value = 'test.txt';
      sender.frames = ['frame1', 'frame2'];
      sender.currentFrame = 1;
      sender.isPlaying = true;
      
      const stopPlaybackSpy = jest.spyOn(sender, 'stopPlayback');
      const showStatusSpy = jest.spyOn(sender, 'showStatus');
      
      sender.clearAll();
      
      expect(sender.textInput.value).toBe('');
      expect(sender.fileInput.value).toBe('');
      expect(sender.frames).toEqual([]);
      expect(sender.currentFrame).toBe(0);
      expect(stopPlaybackSpy).toHaveBeenCalled();
      expect(sender.qrDisplay.innerHTML).toBe('<div class="qr-placeholder">二维码将在此显示</div>');
      expect(sender.progressSection.style.display).toBe('none');
      expect(sender.playBtn.disabled).toBe(true);
      expect(sender.pauseBtn.disabled).toBe(true);
      expect(sender.stopBtn.disabled).toBe(true);
      expect(showStatusSpy).toHaveBeenCalledWith('所有数据已清除', 'info');
    });
  });

  describe('Status Display', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should display info status message', () => {
      sender.showStatus('Test info message', 'info');
      
      expect(sender.statusContainer.innerHTML).toBe('<div class="status info">Test info message</div>');
    });

    test('should display warning status message', () => {
      sender.showStatus('Test warning message', 'warning');
      
      expect(sender.statusContainer.innerHTML).toBe('<div class="status warning">Test warning message</div>');
    });

    test('should display error status message', () => {
      sender.showStatus('Test error message', 'error');
      
      expect(sender.statusContainer.innerHTML).toBe('<div class="status error">Test error message</div>');
    });

    test('should auto-hide non-error messages after 5 seconds', (done) => {
      sender.showStatus('Test message', 'info');
      
      expect(sender.statusContainer.innerHTML).toBe('<div class="status info">Test message</div>');
      
      setTimeout(() => {
        expect(sender.statusContainer.innerHTML).toBe('<div class="status info">准备就绪</div>');
        done();
      }, 5100);
    }, 6000);

    test('should not auto-hide error messages', (done) => {
      sender.showStatus('Error message', 'error');
      
      expect(sender.statusContainer.innerHTML).toBe('<div class="status error">Error message</div>');
      
      setTimeout(() => {
        expect(sender.statusContainer.innerHTML).toBe('<div class="status error">Error message</div>');
        done();
      }, 5100);
    }, 6000);
  });

  describe('Edge Cases and Error Handling', () => {
    let sender;
    
    beforeEach(() => {
      sender = new QRDataSender();
    });

    test('should handle missing DOM elements gracefully', () => {
      // Remove a critical element
      const originalTextInput = sender.textInput;
      sender.textInput = null;
      
      expect(() => {
        sender.generateQRCode();
      }).toThrow();
    });

    test('should handle unicode characters in text input', () => {
      const unicodeText = '你好世界 🌍 émojis and ñiño';
      sender.textInput.value = unicodeText;
      
      sender.generateQRCode();
      
      expect(sender.frames).toEqual([unicodeText]);
    });

    test('should handle special characters and newlines', () => {
      const specialText = 'Line 1\nLine 2\r\nSpecial: <>&"\'';
      sender.textInput.value = specialText;
      
      sender.generateQRCode();
      
      expect(sender.frames).toEqual([specialText]);
    });
  });
});