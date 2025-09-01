// Standalone unit tests for QRDataSender class
// This file tests the extracted application logic without HTML parsing

// Import mocks
const { MockQRCode } = require('../mocks/qr-libraries');

// Define the QRDataSender class directly (extracted from sender.html)
class QRDataSender {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.config = {
            maxChunkSize: 800,
            interval: 1500,
            qrSize: 256,
            errorCorrectionLevel: 'M'
        };
        this.frames = [];
        this.currentFrame = 0;
        this.playbackInterval = null;
        this.isPlaying = false;
    }

    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.fileInput = document.getElementById('fileInput');
        
        // Control buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Display elements
        this.qrDisplay = document.getElementById('qrDisplay');
        this.statusContainer = document.getElementById('statusContainer');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Setting elements
        this.intervalInput = document.getElementById('intervalInput');
        this.intervalDisplay = document.getElementById('intervalDisplay');
        this.qrSizeInput = document.getElementById('qrSizeInput');
        this.qrSizeDisplay = document.getElementById('qrSizeDisplay');
    }

    initializeEventListeners() {
        if (this.generateBtn) this.generateBtn.addEventListener('click', () => this.generateQRCode());
        if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.clearAll());
        if (this.playBtn) this.playBtn.addEventListener('click', () => this.startPlayback());
        if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.pausePlayback());
        if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stopPlayback());
        
        if (this.intervalInput) {
            this.intervalInput.addEventListener('input', (e) => {
                this.config.interval = parseInt(e.target.value);
                if (this.intervalDisplay) this.intervalDisplay.textContent = `${e.target.value}ms`;
            });
        }
        
        if (this.qrSizeInput) {
            this.qrSizeInput.addEventListener('input', (e) => {
                this.config.qrSize = parseInt(e.target.value);
                if (this.qrSizeDisplay) this.qrSizeDisplay.textContent = `${e.target.value}px`;
            });
        }
        
        // File input disabled for Phase 1
        if (this.fileInput) this.fileInput.disabled = true;
    }

    generateQRCode() {
        const text = this.textInput ? this.textInput.value.trim() : '';
        
        if (!text) {
            this.showStatus('请输入要传输的文本', 'warning');
            return;
        }

        try {
            this.showStatus('正在生成二维码...', 'info');
            
            // Phase 1: Simple single QR code (no chunking yet)
            this.frames = [text]; // Single frame for now
            this.displayQRCode(text, 0);
            
            // Enable playback controls
            if (this.playBtn) this.playBtn.disabled = false;
            if (this.pauseBtn) this.pauseBtn.disabled = false;
            if (this.stopBtn) this.stopBtn.disabled = false;
            
            this.showStatus(`二维码生成成功 (${text.length} 个字符)`, 'info');
            
        } catch (error) {
            console.error('QR Generation Error:', error);
            this.showStatus('生成二维码错误: ' + error.message, 'error');
        }
    }

    displayQRCode(data, frameIndex = 0) {
        try {
            // Clear existing QR display
            if (this.qrDisplay) this.qrDisplay.innerHTML = '';
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.width = this.config.qrSize;
            canvas.height = this.config.qrSize;
            
            // Generate QR code using mocked library
            const qrcode = new QRCode(this.qrDisplay, {
                text: data,
                width: this.config.qrSize,
                height: this.config.qrSize,
                correctLevel: QRCode.CorrectLevel[this.config.errorCorrectionLevel]
            });
            
            // Update progress
            this.updateProgress(frameIndex + 1, this.frames.length);
            
        } catch (error) {
            console.error('Display Error:', error);
            this.showStatus('显示二维码错误: ' + error.message, 'error');
        }
    }

    startPlayback() {
        if (this.frames.length === 0) {
            this.showStatus('没有二维码可播放，请先生成', 'warning');
            return;
        }

        this.isPlaying = true;
        if (this.playBtn) this.playBtn.disabled = true;
        if (this.pauseBtn) this.pauseBtn.disabled = false;
        if (this.progressSection) this.progressSection.style.display = 'block';
        
        // For Phase 1, just display the single QR code
        this.displayQRCode(this.frames[0], 0);
        this.showStatus('播放二维码 (第一阶段：单帧)', 'info');
    }

    pausePlayback() {
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        
        this.showStatus('播放已暂停', 'info');
    }

    stopPlayback() {
        this.isPlaying = false;
        if (this.playBtn) this.playBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        this.currentFrame = 0;
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        
        if (this.progressSection) this.progressSection.style.display = 'none';
        if (this.qrDisplay) this.qrDisplay.innerHTML = '<div class="qr-placeholder">播放已停止</div>';
        this.showStatus('播放已停止', 'info');
    }

    updateProgress(current, total) {
        if (total > 0) {
            const percentage = (current / total) * 100;
            if (this.progressFill) this.progressFill.style.width = `${percentage}%`;
            if (this.progressText) this.progressText.textContent = `帧 ${current} / ${total}`;
        }
    }

    clearAll() {
        if (this.textInput) this.textInput.value = '';
        if (this.fileInput) this.fileInput.value = '';
        this.frames = [];
        this.currentFrame = 0;
        this.stopPlayback();
        
        if (this.qrDisplay) this.qrDisplay.innerHTML = '<div class="qr-placeholder">二维码将在此显示</div>';
        if (this.progressSection) this.progressSection.style.display = 'none';
        
        if (this.playBtn) this.playBtn.disabled = true;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = true;
        
        this.showStatus('所有数据已清除', 'info');
    }

    showStatus(message, type = 'info') {
        if (this.statusContainer) {
            this.statusContainer.innerHTML = `<div class="status ${type}">${message}</div>`;
        }
        
        // Auto-hide non-error messages after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                if (this.statusContainer && this.statusContainer.innerHTML.includes(message)) {
                    this.statusContainer.innerHTML = '<div class="status info">准备就绪</div>';
                }
            }, 5000);
        }
    }
}

describe('QR Data Sender (Standalone)', () => {
    let sender;
    let mockElements;

    beforeEach(() => {
        // Set up global QRCode mock - proper constructor implementation
        global.QRCode = jest.fn().mockImplementation((element, options) => {
            const mockInstance = new MockQRCode(element, options);
            return mockInstance;
        });
        
        // Create mock DOM elements
        mockElements = {
            textInput: { value: '', addEventListener: jest.fn() },
            fileInput: { value: '', disabled: false, addEventListener: jest.fn() },
            generateBtn: { disabled: false, addEventListener: jest.fn() },
            clearBtn: { disabled: false, addEventListener: jest.fn() },
            playBtn: { disabled: true, addEventListener: jest.fn() },
            pauseBtn: { disabled: true, addEventListener: jest.fn() },
            stopBtn: { disabled: true, addEventListener: jest.fn() },
            qrDisplay: { 
                innerHTML: '', 
                appendChild: jest.fn(),
                removeChild: jest.fn() 
            },
            statusContainer: { innerHTML: '' },
            progressSection: { style: { display: 'none' } },
            progressFill: { style: { width: '0%' } },
            progressText: { textContent: '' },
            intervalInput: { addEventListener: jest.fn() },
            intervalDisplay: { textContent: '' },
            qrSizeInput: { addEventListener: jest.fn() },
            qrSizeDisplay: { textContent: '' }
        };

        // Mock document.getElementById
        document.getElementById = jest.fn((id) => mockElements[id] || null);
        
        // Create canvas mock
        document.createElement = jest.fn((tagName) => {
            if (tagName === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: jest.fn(() => ({
                        fillStyle: '',
                        fillRect: jest.fn(),
                        clearRect: jest.fn()
                    }))
                };
            }
            return {};
        });

        // Set up QRCode.CorrectLevel for the tests
        global.QRCode.CorrectLevel = MockQRCode.CorrectLevel;

        sender = new QRDataSender();
    });

    afterEach(() => {
        if (sender.playbackInterval) {
            clearInterval(sender.playbackInterval);
        }
    });

    describe('Class Instantiation', () => {
        test('should create QRDataSender instance with default configuration', () => {
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
            expect(document.getElementById).toHaveBeenCalledWith('textInput');
            expect(document.getElementById).toHaveBeenCalledWith('generateBtn');
            expect(document.getElementById).toHaveBeenCalledWith('qrDisplay');
        });

        test('should set up event listeners', () => {
            expect(mockElements.generateBtn.addEventListener).toHaveBeenCalled();
            expect(mockElements.clearBtn.addEventListener).toHaveBeenCalled();
            expect(mockElements.intervalInput.addEventListener).toHaveBeenCalled();
        });
    });

    describe('QR Code Generation', () => {
        test('should generate QR code for valid text input', () => {
            mockElements.textInput.value = 'Test message';
            
            sender.generateQRCode();
            
            expect(sender.frames).toEqual(['Test message']);
            expect(mockElements.playBtn.disabled).toBe(false);
            expect(global.QRCode).toHaveBeenCalled();
        });

        test('should show warning for empty text input', () => {
            mockElements.textInput.value = '';
            
            sender.generateQRCode();
            
            expect(sender.frames).toEqual([]);
            expect(mockElements.statusContainer.innerHTML).toContain('请输入要传输的文本');
        });

        test('should show warning for whitespace-only input', () => {
            mockElements.textInput.value = '   ';
            
            sender.generateQRCode();
            
            expect(sender.frames).toEqual([]);
            expect(mockElements.statusContainer.innerHTML).toContain('请输入要传输的文本');
        });

        test('should handle unicode characters in text input', () => {
            mockElements.textInput.value = '测试中文字符 🎉';
            
            sender.generateQRCode();
            
            expect(sender.frames).toEqual(['测试中文字符 🎉']);
            expect(global.QRCode).toHaveBeenCalled();
        });
    });

    describe('Playback Controls', () => {
        beforeEach(() => {
            sender.frames = ['Test frame'];
        });

        test('should start playback when frames exist', () => {
            sender.startPlayback();
            
            expect(sender.isPlaying).toBe(true);
            expect(mockElements.playBtn.disabled).toBe(true);
            expect(mockElements.pauseBtn.disabled).toBe(false);
        });

        test('should show warning when starting playback without frames', () => {
            sender.frames = [];
            
            sender.startPlayback();
            
            expect(sender.isPlaying).toBe(false);
            expect(mockElements.statusContainer.innerHTML).toContain('没有二维码可播放');
        });

        test('should pause playback correctly', () => {
            sender.isPlaying = true;
            
            sender.pausePlayback();
            
            expect(sender.isPlaying).toBe(false);
            expect(mockElements.playBtn.disabled).toBe(false);
            expect(mockElements.pauseBtn.disabled).toBe(true);
        });

        test('should stop playback and reset state', () => {
            sender.isPlaying = true;
            sender.currentFrame = 5;
            
            sender.stopPlayback();
            
            expect(sender.isPlaying).toBe(false);
            expect(sender.currentFrame).toBe(0);
            expect(mockElements.progressSection.style.display).toBe('none');
        });
    });

    describe('Configuration Updates', () => {
        test('should update interval configuration', () => {
            const mockEvent = { target: { value: '2000' } };
            
            // Simulate interval input change
            const intervalCallback = mockElements.intervalInput.addEventListener.mock.calls
                .find(call => call[0] === 'input')[1];
            intervalCallback(mockEvent);
            
            expect(sender.config.interval).toBe(2000);
        });

        test('should update QR size configuration', () => {
            const mockEvent = { target: { value: '512' } };
            
            // Simulate QR size input change
            const sizeCallback = mockElements.qrSizeInput.addEventListener.mock.calls
                .find(call => call[0] === 'input')[1];
            sizeCallback(mockEvent);
            
            expect(sender.config.qrSize).toBe(512);
        });
    });

    describe('Clear Functionality', () => {
        test('should clear all data and reset state', () => {
            sender.frames = ['test'];
            sender.isPlaying = true;
            mockElements.textInput.value = 'test';
            
            sender.clearAll();
            
            expect(sender.frames).toEqual([]);
            expect(sender.currentFrame).toBe(0);
            expect(sender.isPlaying).toBe(false);
            expect(mockElements.textInput.value).toBe('');
        });
    });

    describe('Status Display', () => {
        test('should display status messages with correct styling', () => {
            sender.showStatus('Test message', 'info');
            
            expect(mockElements.statusContainer.innerHTML).toContain('Test message');
            expect(mockElements.statusContainer.innerHTML).toContain('status info');
        });

        test('should auto-hide non-error messages after 5 seconds', (done) => {
            sender.showStatus('Test message', 'info');
            
            setTimeout(() => {
                expect(mockElements.statusContainer.innerHTML).toContain('准备就绪');
                done();
            }, 5100);
        });

        test('should not auto-hide error messages', (done) => {
            sender.showStatus('Error message', 'error');
            
            setTimeout(() => {
                expect(mockElements.statusContainer.innerHTML).toContain('Error message');
                done();
            }, 5100);
        });
    });

    describe('Progress Updates', () => {
        test('should update progress display correctly', () => {
            sender.updateProgress(3, 5);
            
            expect(mockElements.progressFill.style.width).toBe('60%');
            expect(mockElements.progressText.textContent).toBe('帧 3 / 5');
        });

        test('should handle zero total frames', () => {
            sender.updateProgress(1, 0);
            
            // Should not crash or update anything
            expect(mockElements.progressFill.style.width).toBe('0%');
        });
    });

    describe('Error Handling', () => {
        test('should handle QR generation errors gracefully', () => {
            mockElements.textInput.value = 'Test';
            
            // Create a mock that throws error on instantiation
            global.QRCode = jest.fn().mockImplementation(() => {
                throw new Error('QR generation failed');
            });
            
            // Mock console.error to prevent console output during test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            sender.generateQRCode();
            
            expect(mockElements.statusContainer.innerHTML).toContain('显示二维码错误');
            
            consoleSpy.mockRestore();
        });

        test('should handle missing DOM elements gracefully', () => {
            document.getElementById = jest.fn(() => null);
            
            expect(() => new QRDataSender()).not.toThrow();
        });
    });
});