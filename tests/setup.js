// Jest test setup file - configures global mocks and environment

// Mock browser APIs - comprehensive navigator mock
const createNavigatorMock = () => ({
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn(() => [{ stop: jest.fn() }])
    }),
    getDisplayMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn(() => [{ stop: jest.fn() }])
    })
  },
  clipboard: {
    writeText: jest.fn().mockResolvedValue(),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(),
    read: jest.fn().mockResolvedValue([])
  },
  userAgent: 'Mozilla/5.0 (Test Environment) AppleWebKit/537.36',
  permissions: {
    query: jest.fn().mockResolvedValue({ state: 'granted' })
  },
  platform: 'Test',
  language: 'en-US',
  languages: ['en-US', 'en'],
  onLine: true,
  cookieEnabled: true
});

global.navigator = createNavigatorMock();

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  },
  get length() {
    return Object.keys(this.store).length;
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock Canvas API for QR code generation
class MockCanvas {
  constructor(width = 256, height = 256) {
    this.width = width;
    this.height = height;
    this._context = new MockCanvasRenderingContext2D();
  }
  
  getContext(type) {
    return this._context;
  }
  
  toDataURL() {
    return 'data:image/png;base64,mockImageData';
  }
}

class MockCanvasRenderingContext2D {
  fillRect() {}
  fillText() {}
  drawImage() {}
  getImageData(x, y, width, height) {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    };
  }
  set fillStyle(value) {
    this._fillStyle = value;
  }
  get fillStyle() {
    return this._fillStyle;
  }
}

global.HTMLCanvasElement = MockCanvas;

// Override document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
  if (tagName === 'canvas') {
    return new MockCanvas();
  }
  return originalCreateElement.call(this, tagName);
};

// Mock video element
global.HTMLVideoElement = class {
  constructor() {
    this.videoWidth = 640;
    this.videoHeight = 480;
    this.srcObject = null;
    this._eventListeners = {};
  }
  
  play() {
    return Promise.resolve();
  }
  
  addEventListener(event, callback) {
    this._eventListeners[event] = callback;
  }
  
  removeEventListener(event, callback) {
    delete this._eventListeners[event];
  }
  
  dispatchEvent(event) {
    if (this._eventListeners[event.type]) {
      this._eventListeners[event.type](event);
    }
  }
  
  set style(value) {
    this._style = value;
  }
  
  get style() {
    return this._style || { filter: '' };
  }
};

// Mock MediaStream
global.MediaStream = class {
  constructor() {
    this.tracks = [
      {
        kind: 'video',
        stop: jest.fn()
      }
    ];
  }
  
  getTracks() {
    return this.tracks;
  }
};

// Mock QR libraries (to be replaced with actual implementations in tests)
global.QRCode = class {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.makeCode(options.text);
  }
  
  makeCode(text) {
    if (this.element && this.element.appendChild) {
      const canvas = new MockCanvas(this.options.width, this.options.height);
      this.element.appendChild(canvas);
    }
  }
  
  static CorrectLevel = {
    L: 1,
    M: 2, 
    Q: 3,
    H: 4
  };
};

global.jsQR = jest.fn();

// Mock window.confirm and window.alert
global.confirm = jest.fn(() => true);
global.alert = jest.fn();

// Mock performance.now for consistent timing in tests
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock Image constructor for testing image loading
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
  
  set src(value) {
    this._src = value;
    // Simulate successful image load
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};

// Helper function to simulate HTML page loading
global.loadHTMLPage = function(htmlContent) {
  document.documentElement.innerHTML = htmlContent;
  
  // Execute scripts in the HTML
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    if (script.textContent) {
      try {
        eval(script.textContent);
      } catch (error) {
        console.warn('Error executing script:', error);
      }
    }
  });
  
  // Trigger DOMContentLoaded
  const event = new Event('DOMContentLoaded');
  document.dispatchEvent(event);
};

// Clean up between tests
afterEach(() => {
  // Clear localStorage
  localStorageMock.clear();
  
  // Clear document
  document.documentElement.innerHTML = '';
  
  // Reset mocks
  jest.clearAllMocks();
  
  // Clear global variables
  if (global.qrSender) delete global.qrSender;
  if (global.qrReceiver) delete global.qrReceiver;
});

// Increase timeout for integration tests
jest.setTimeout(10000);