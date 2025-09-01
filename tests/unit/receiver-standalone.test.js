// Standalone unit tests for QRDataReceiver class
// This file tests the extracted application logic without HTML parsing

// Import mocks
const { mockJsQR } = require('../mocks/qr-libraries');

// Define the QRDataReceiver class directly (extracted from receiver.html)
class QRDataReceiver {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.stream = null;
        this.scanInterval = null;
        this.receivedFrames = new Map();
        this.totalFrames = 0;
        this.lastScannedData = null;
        this.sessionId = null;
        this.scanCount = 0;
    }

    initializeElements() {
        // Media elements
        this.video = document.getElementById('videoElement');
        this.videoContainer = document.getElementById('videoContainer');
        
        // Control buttons
        this.startCameraBtn = document.getElementById('startCameraBtn');
        this.stopCameraBtn = document.getElementById('stopCameraBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.saveToStorageBtn = document.getElementById('saveToStorageBtn');
        this.clearStorageBtn = document.getElementById('clearStorageBtn');
        
        // Display elements
        this.statusContainer = document.getElementById('statusContainer');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.receivedData = document.getElementById('receivedData');
        this.storedDataSection = document.getElementById('storedDataSection');
        this.storedSessions = document.getElementById('storedSessions');
    }

    initializeEventListeners() {
        if (this.startCameraBtn) this.startCameraBtn.addEventListener('click', () => this.startCamera());
        if (this.stopCameraBtn) this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetSession());
        if (this.copyBtn) this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        if (this.saveToStorageBtn) this.saveToStorageBtn.addEventListener('click', () => this.saveToStorage());
        if (this.clearStorageBtn) this.clearStorageBtn.addEventListener('click', () => this.clearAllStorage());
        
        // Load existing stored data on startup
        this.loadStoredSessions();
    }

    async startCamera() {
        try {
            this.showStatus('正在请求摄像头权限...', 'info');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer rear camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.play();
                
                // Start scanning after video is ready
                this.video.addEventListener('loadedmetadata', () => {
                    this.startScanning();
                });
            }
            
            if (this.startCameraBtn) this.startCameraBtn.disabled = true;
            if (this.stopCameraBtn) this.stopCameraBtn.disabled = false;
            if (this.progressSection) this.progressSection.style.display = 'block';
            
            this.showStatus('摄像头已启动，请将摄像头对准二维码', 'info');
        } catch (error) {
            console.error('Camera access error:', error);
            this.showStatus('摄像头访问失败: ' + error.message, 'error');
            this.showStatus('请确保使用HTTPS并授予摄像头权限', 'warning');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        if (this.video) this.video.srcObject = null;
        if (this.startCameraBtn) this.startCameraBtn.disabled = false;
        if (this.stopCameraBtn) this.stopCameraBtn.disabled = true;
        this.showStatus('摄像头已停止', 'info');
    }

    startScanning() {
        // Scan every 100ms for responsive detection
        this.scanInterval = setInterval(() => {
            this.scanFrame();
        }, 100);
        this.showStatus('正在扫描二维码...', 'info');
    }

    scanFrame() {
        if (!this.video || !this.video.videoWidth || !this.video.videoHeight) {
            return;
        }
        
        try {
            // Create canvas for frame capture
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            
            // Draw current frame
            context.drawImage(this.video, 0, 0);
            
            // Get image data for QR scanning
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                this.processQRCode(code.data);
            }
        } catch (error) {
            console.error('QR scanning error:', error);
            // Show error status but don't crash the application
            this.showStatus('QR扫描错误: ' + error.message, 'error');
        }
    }

    processQRCode(qrData) {
        // Prevent processing same QR code multiple times rapidly
        if (qrData === this.lastScannedData) {
            return;
        }
        this.lastScannedData = qrData;
        this.scanCount++;

        try {
            // For Phase 1: Simple text processing (no frame protocol yet)
            this.showStatus(`检测到二维码 (第${this.scanCount}次扫描)`, 'info');
            
            // Display the received text
            if (this.receivedData) this.receivedData.value = qrData;
            if (this.resultsSection) this.resultsSection.style.display = 'block';
            
            // Update progress to show completion
            if (this.progressFill) this.progressFill.style.width = '100%';
            if (this.progressText) this.progressText.textContent = '传输完成！';
            
            // Flash success
            if (this.video) {
                this.video.style.filter = 'brightness(1.2)';
                setTimeout(() => {
                    this.video.style.filter = 'none';
                }, 200);
            }
            
            this.showStatus('数据接收成功！', 'info');
            // Auto-save to localStorage
            this.autoSaveData(qrData);
        } catch (error) {
            console.error('QR processing error:', error);
            this.showStatus('处理二维码错误: ' + error.message, 'error');
        }
        
        // Clear the last scanned data after a delay to allow re-scanning
        setTimeout(() => {
            this.lastScannedData = null;
        }, 1000);
    }

    autoSaveData(data) {
        const sessionId = 'session_' + Date.now();
        const sessionData = {
            id: sessionId,
            timestamp: new Date().toISOString(),
            type: 'text',
            data: data,
            size: data.length
        };
        
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(sessionId, JSON.stringify(sessionData));
            this.loadStoredSessions();
        }
        
        this.showStatus('数据已自动保存到本地存储', 'info');
    }

    resetSession() {
        this.receivedFrames.clear();
        this.totalFrames = 0;
        this.lastScannedData = null;
        this.sessionId = null;
        this.scanCount = 0;
        
        if (this.receivedData) this.receivedData.value = '';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.progressSection) this.progressSection.style.display = 'none';
        
        this.showStatus('会话已重置', 'info');
    }

    async copyToClipboard() {
        const data = this.receivedData ? this.receivedData.value : '';
        if (!data) {
            this.showStatus('没有数据可复制', 'warning');
            return;
        }

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(data);
                this.showStatus('数据已复制到剪贴板', 'info');
            } else {
                // Fallback to legacy method
                this.fallbackCopyToClipboard(data);
            }
        } catch (error) {
            console.error('Copy error:', error);
            this.fallbackCopyToClipboard(data);
        }
    }

    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showStatus('数据已复制到剪贴板', 'info');
            } else {
                this.showStatus('复制失败，请手动选择文本', 'error');
            }
        } catch (error) {
            console.error('Fallback copy error:', error);
            this.showStatus('复制失败: ' + error.message, 'error');
        }
    }

    saveToStorage() {
        const data = this.receivedData ? this.receivedData.value : '';
        if (!data) {
            this.showStatus('没有数据可保存', 'warning');
            return;
        }
        this.autoSaveData(data);
    }

    loadStoredSessions() {
        if (typeof localStorage === 'undefined' || !this.storedSessions) {
            return;
        }

        const sessions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('session_')) {
                try {
                    const sessionData = JSON.parse(localStorage.getItem(key));
                    sessions.push(sessionData);
                } catch (error) {
                    console.error('Error loading session:', error);
                }
            }
        }

        if (sessions.length > 0) {
            if (this.storedDataSection) this.storedDataSection.style.display = 'block';
            // Sort by timestamp (newest first)
            sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.displayStoredSessions(sessions);
        }
    }

    displayStoredSessions(sessions) {
        if (!this.storedSessions) return;
        
        this.storedSessions.innerHTML = sessions.map(session => `
            <div class="stored-session">
                <div class="session-info">
                    <strong>ID:</strong> ${session.id}<br>
                    <strong>时间:</strong> ${new Date(session.timestamp).toLocaleString()}<br>
                    <strong>类型:</strong> ${session.type}<br>
                    <strong>大小:</strong> ${session.size} 字符
                </div>
                <div class="session-data">${session.data.substring(0, 100)}${session.data.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }

    clearAllStorage() {
        if (typeof localStorage === 'undefined') {
            this.showStatus('本地存储不可用', 'error');
            return;
        }

        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('session_')) {
                keys.push(key);
            }
        }

        keys.forEach(key => localStorage.removeItem(key));
        
        if (this.storedDataSection) this.storedDataSection.style.display = 'none';
        if (this.storedSessions) this.storedSessions.innerHTML = '';
        
        this.showStatus(`已清除 ${keys.length} 个存储会话`, 'info');
    }

    showStatus(message, type = 'info') {
        if (this.statusContainer) {
            this.statusContainer.innerHTML = `<div class="status ${type}">${message}</div>`;
        }
        
        // Auto-hide non-error messages after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                if (this.statusContainer && this.statusContainer.innerHTML.includes(message)) {
                    this.statusContainer.innerHTML = '<div class="status info">准备扫描二维码</div>';
                }
            }, 5000);
        }
    }
}

describe('QR Data Receiver (Standalone)', () => {
    let receiver;
    let mockElements;
    let mockLocalStorage;

    beforeEach(() => {
        // Set up global jsQR mock
        global.jsQR = mockJsQR;
        
        // Mock localStorage
        mockLocalStorage = {
            data: {},
            setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
            clear: jest.fn(() => { mockLocalStorage.data = {}; }),
            get length() { return Object.keys(mockLocalStorage.data).length; },
            key: jest.fn((index) => Object.keys(mockLocalStorage.data)[index] || null)
        };
        global.localStorage = mockLocalStorage;
        
        // Create mock DOM elements
        mockElements = {
            videoElement: { 
                srcObject: null, 
                videoWidth: 640, 
                videoHeight: 480,
                addEventListener: jest.fn(),
                play: jest.fn(),
                style: { filter: 'none' }
            },
            videoContainer: {},
            startCameraBtn: { disabled: false, addEventListener: jest.fn() },
            stopCameraBtn: { disabled: true, addEventListener: jest.fn() },
            resetBtn: { addEventListener: jest.fn() },
            copyBtn: { addEventListener: jest.fn() },
            saveToStorageBtn: { addEventListener: jest.fn() },
            clearStorageBtn: { addEventListener: jest.fn() },
            statusContainer: { innerHTML: '' },
            progressSection: { style: { display: 'none' } },
            progressFill: { style: { width: '0%' } },
            progressText: { textContent: '' },
            resultsSection: { style: { display: 'none' } },
            receivedData: { value: '' },
            storedDataSection: { style: { display: 'none' } },
            storedSessions: { innerHTML: '' }
        };

        // Mock document.getElementById
        document.getElementById = jest.fn((id) => mockElements[id] || null);
        
        // Mock document.createElement
        document.createElement = jest.fn((tagName) => {
            if (tagName === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: jest.fn(() => ({
                        drawImage: jest.fn(),
                        getImageData: jest.fn(() => ({
                            data: new Uint8ClampedArray(640 * 480 * 4),
                            width: 640,
                            height: 480
                        }))
                    }))
                };
            }
            if (tagName === 'textarea') {
                return {
                    value: '',
                    style: {},
                    focus: jest.fn(),
                    select: jest.fn()
                };
            }
            return {};
        });

        // Mock navigator.mediaDevices - use comprehensive mock
        global.navigator = {
            mediaDevices: {
                getUserMedia: jest.fn().mockResolvedValue({
                    getTracks: jest.fn(() => [{
                        stop: jest.fn()
                    }])
                })
            },
            clipboard: {
                writeText: jest.fn().mockResolvedValue(),
                readText: jest.fn().mockResolvedValue(''),
                write: jest.fn().mockResolvedValue(),
                read: jest.fn().mockResolvedValue([])
            },
            permissions: {
                query: jest.fn().mockResolvedValue({ state: 'granted' })
            }
        };

        // Mock document.execCommand
        document.execCommand = jest.fn().mockReturnValue(true);
        
        // Mock document.body
        Object.defineProperty(document, 'body', {
            value: {
                appendChild: jest.fn(),
                removeChild: jest.fn()
            },
            writable: true
        });

        receiver = new QRDataReceiver();
    });

    afterEach(() => {
        if (receiver.scanInterval) {
            clearInterval(receiver.scanInterval);
        }
    });

    describe('Class Instantiation', () => {
        test('should create QRDataReceiver instance with correct initial state', () => {
            expect(receiver).toBeInstanceOf(QRDataReceiver);
            expect(receiver.stream).toBeNull();
            expect(receiver.scanInterval).toBeNull();
            expect(receiver.receivedFrames).toBeInstanceOf(Map);
            expect(receiver.totalFrames).toBe(0);
            expect(receiver.scanCount).toBe(0);
        });

        test('should initialize DOM elements correctly', () => {
            expect(document.getElementById).toHaveBeenCalledWith('videoElement');
            expect(document.getElementById).toHaveBeenCalledWith('startCameraBtn');
            expect(document.getElementById).toHaveBeenCalledWith('statusContainer');
        });

        test('should set up event listeners', () => {
            expect(mockElements.startCameraBtn.addEventListener).toHaveBeenCalled();
            expect(mockElements.stopCameraBtn.addEventListener).toHaveBeenCalled();
            expect(mockElements.resetBtn.addEventListener).toHaveBeenCalled();
        });

        test('should load stored sessions on initialization', () => {
            // Should not crash even with empty localStorage
            expect(() => receiver.loadStoredSessions()).not.toThrow();
        });
    });

    describe('Camera Management', () => {
        test('should start camera successfully', async () => {
            await receiver.startCamera();
            
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            expect(mockElements.startCameraBtn.disabled).toBe(true);
            expect(mockElements.stopCameraBtn.disabled).toBe(false);
        });

        test('should handle camera access error', async () => {
            navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));
            
            await receiver.startCamera();
            
            expect(mockElements.statusContainer.innerHTML).toContain('摄像头访问失败');
        });

        test('should stop camera and cleanup resources', () => {
            const mockStream = {
                getTracks: jest.fn(() => [{ stop: jest.fn() }])
            };
            receiver.stream = mockStream;
            receiver.scanInterval = setInterval(() => {}, 100);
            
            receiver.stopCamera();
            
            expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
            expect(receiver.stream).toBeNull();
            expect(receiver.scanInterval).toBeNull();
        });
    });

    describe('QR Code Scanning', () => {
        beforeEach(() => {
            receiver.video = mockElements.videoElement;
        });

        test('should start scanning interval', () => {
            jest.spyOn(global, 'setInterval');
            
            receiver.startScanning();
            
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 100);
            expect(receiver.scanInterval).not.toBeNull();
        });

        test('should process QR code data correctly', () => {
            const testData = 'Test QR data';
            
            receiver.processQRCode(testData);
            
            expect(mockElements.receivedData.value).toBe(testData);
            expect(mockElements.resultsSection.style.display).toBe('block');
            expect(receiver.scanCount).toBe(1);
        });

        test('should prevent duplicate processing of same QR data', () => {
            const testData = 'Test QR data';
            
            receiver.processQRCode(testData);
            receiver.processQRCode(testData); // Should be ignored
            
            expect(receiver.scanCount).toBe(1);
        });

        test('should handle QR scanning errors gracefully', () => {
            global.jsQR = jest.fn().mockImplementation(() => {
                throw new Error('Scanning failed');
            });
            
            expect(() => receiver.scanFrame()).not.toThrow();
        });
    });

    describe('Clipboard Operations', () => {
        test('should copy data to clipboard using modern API', async () => {
            mockElements.receivedData.value = 'Test data';
            
            await receiver.copyToClipboard();
            
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test data');
        });

        test('should fallback to legacy clipboard API when modern API fails', async () => {
            mockElements.receivedData.value = 'Test data';
            navigator.clipboard.writeText.mockRejectedValue(new Error('Not available'));
            
            await receiver.copyToClipboard();
            
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });

        test('should show warning when no data to copy', async () => {
            mockElements.receivedData.value = '';
            
            await receiver.copyToClipboard();
            
            expect(mockElements.statusContainer.innerHTML).toContain('没有数据可复制');
        });
    });

    describe('Session Management', () => {
        test('should reset session state correctly', () => {
            receiver.receivedFrames.set('1', 'data');
            receiver.totalFrames = 5;
            receiver.scanCount = 3;
            mockElements.receivedData.value = 'test';
            
            receiver.resetSession();
            
            expect(receiver.receivedFrames.size).toBe(0);
            expect(receiver.totalFrames).toBe(0);
            expect(receiver.scanCount).toBe(0);
            expect(mockElements.receivedData.value).toBe('');
        });

        test('should auto-save data to localStorage', () => {
            const testData = 'Test data for storage';
            
            receiver.autoSaveData(testData);
            
            expect(localStorage.setItem).toHaveBeenCalled();
            const setItemCall = localStorage.setItem.mock.calls[0];
            expect(setItemCall[0]).toMatch(/^session_\d+$/);
            
            const savedData = JSON.parse(setItemCall[1]);
            expect(savedData.data).toBe(testData);
            expect(savedData.type).toBe('text');
        });
    });

    describe('Storage Management', () => {
        test('should load and display stored sessions', () => {
            // Setup mock data
            const sessionData = {
                id: 'session_123',
                timestamp: new Date().toISOString(),
                type: 'text',
                data: 'Stored test data',
                size: 17
            };
            mockLocalStorage.data['session_123'] = JSON.stringify(sessionData);
            
            receiver.loadStoredSessions();
            
            expect(mockElements.storedDataSection.style.display).toBe('block');
            expect(mockElements.storedSessions.innerHTML).toContain('Stored test data');
        });

        test('should clear all stored sessions', () => {
            mockLocalStorage.data['session_1'] = '{"data": "test1"}';
            mockLocalStorage.data['session_2'] = '{"data": "test2"}';
            mockLocalStorage.data['other_key'] = '{"data": "other"}';
            
            receiver.clearAllStorage();
            
            expect(localStorage.removeItem).toHaveBeenCalledWith('session_1');
            expect(localStorage.removeItem).toHaveBeenCalledWith('session_2');
            expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_key');
        });
    });

    describe('Status Display', () => {
        test('should display status messages with correct styling', () => {
            receiver.showStatus('Test message', 'info');
            
            expect(mockElements.statusContainer.innerHTML).toContain('Test message');
            expect(mockElements.statusContainer.innerHTML).toContain('status info');
        });

        test('should auto-hide non-error messages after 5 seconds', (done) => {
            receiver.showStatus('Test message', 'info');
            
            setTimeout(() => {
                expect(mockElements.statusContainer.innerHTML).toContain('准备扫描二维码');
                done();
            }, 5100);
        });

        test('should not auto-hide error messages', (done) => {
            receiver.showStatus('Error message', 'error');
            
            setTimeout(() => {
                expect(mockElements.statusContainer.innerHTML).toContain('Error message');
                done();
            }, 5100);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            document.getElementById = jest.fn(() => null);
            
            expect(() => new QRDataReceiver()).not.toThrow();
        });

        test('should handle localStorage unavailability', () => {
            global.localStorage = undefined;
            
            expect(() => receiver.autoSaveData('test')).not.toThrow();
            expect(() => receiver.loadStoredSessions()).not.toThrow();
        });

        test('should handle invalid JSON in localStorage', () => {
            mockLocalStorage.data['session_invalid'] = 'invalid json';
            
            // Mock console.error to prevent console output during test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(() => receiver.loadStoredSessions()).not.toThrow();
            
            consoleSpy.mockRestore();
        });

        test('should handle video element without dimensions', () => {
            mockElements.videoElement.videoWidth = 0;
            mockElements.videoElement.videoHeight = 0;
            
            expect(() => receiver.scanFrame()).not.toThrow();
        });
    });
});