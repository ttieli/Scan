// Mock implementation for Camera/MediaDevices API

class MockMediaStream {
  constructor(tracks = []) {
    this.tracks = tracks.length > 0 ? tracks : [new MockMediaStreamTrack('video')];
    this.id = 'mock-stream-' + Math.random().toString(36).substr(2, 9);
    this.active = true;
  }
  
  getTracks() {
    return [...this.tracks];
  }
  
  getVideoTracks() {
    return this.tracks.filter(track => track.kind === 'video');
  }
  
  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }
  
  addTrack(track) {
    this.tracks.push(track);
  }
  
  removeTrack(track) {
    const index = this.tracks.indexOf(track);
    if (index > -1) {
      this.tracks.splice(index, 1);
    }
  }
  
  clone() {
    const clonedTracks = this.tracks.map(track => track.clone());
    return new MockMediaStream(clonedTracks);
  }
  
  addEventListener(event, callback) {
    // Mock event listener
  }
  
  removeEventListener(event, callback) {
    // Mock event listener removal
  }
}

class MockMediaStreamTrack {
  constructor(kind = 'video') {
    this.kind = kind;
    this.id = 'mock-track-' + Math.random().toString(36).substr(2, 9);
    this.label = `Mock ${kind} track`;
    this.enabled = true;
    this.muted = false;
    this.readyState = 'live';
    this.contentHint = '';
    
    this._stopped = false;
    this._constraints = null;
  }
  
  getCapabilities() {
    if (this.kind === 'video') {
      return {
        width: { min: 320, max: 1920 },
        height: { min: 240, max: 1080 },
        aspectRatio: { min: 0.5, max: 2.0 },
        frameRate: { min: 1, max: 60 },
        facingMode: ['user', 'environment']
      };
    }
    return {};
  }
  
  getConstraints() {
    return this._constraints || {};
  }
  
  getSettings() {
    if (this.kind === 'video') {
      return {
        width: 1280,
        height: 720,
        aspectRatio: 1280/720,
        frameRate: 30,
        facingMode: 'environment'
      };
    }
    return {};
  }
  
  applyConstraints(constraints) {
    this._constraints = { ...constraints };
    return Promise.resolve();
  }
  
  stop() {
    this._stopped = true;
    this.readyState = 'ended';
    this.enabled = false;
    
    // Dispatch ended event
    if (this.onended) {
      this.onended();
    }
  }
  
  clone() {
    const clonedTrack = new MockMediaStreamTrack(this.kind);
    clonedTrack.enabled = this.enabled;
    clonedTrack._constraints = { ...this._constraints };
    return clonedTrack;
  }
  
  addEventListener(event, callback) {
    if (event === 'ended') {
      this.onended = callback;
    }
  }
  
  removeEventListener(event, callback) {
    if (event === 'ended') {
      this.onended = null;
    }
  }
}

class MockMediaDevices {
  constructor() {
    this._mockError = null;
    this._mockDelay = 0;
    this._supportedConstraints = {
      width: true,
      height: true,
      aspectRatio: true,
      frameRate: true,
      facingMode: true,
      volume: true,
      sampleRate: true,
      echoCancellation: true,
      autoGainControl: true,
      noiseSuppression: true
    };
  }
  
  async getUserMedia(constraints = {}) {
    // Simulate network delay
    if (this._mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this._mockDelay));
    }
    
    // Simulate error conditions
    if (this._mockError) {
      const error = this._mockError;
      this._mockError = null; // Reset after use
      throw error;
    }
    
    // Validate constraints
    if (constraints.video === false && constraints.audio === false) {
      throw new Error('At least one of audio and video must be requested');
    }
    
    const tracks = [];
    
    if (constraints.video) {
      const videoTrack = new MockMediaStreamTrack('video');
      
      // Apply video constraints
      if (typeof constraints.video === 'object') {
        await videoTrack.applyConstraints(constraints.video);
      }
      
      tracks.push(videoTrack);
    }
    
    if (constraints.audio) {
      const audioTrack = new MockMediaStreamTrack('audio');
      
      // Apply audio constraints
      if (typeof constraints.audio === 'object') {
        await audioTrack.applyConstraints(constraints.audio);
      }
      
      tracks.push(audioTrack);
    }
    
    return new MockMediaStream(tracks);
  }
  
  async enumerateDevices() {
    return [
      {
        deviceId: 'mock-camera-1',
        groupId: 'group-1',
        kind: 'videoinput',
        label: 'Mock Camera 1'
      },
      {
        deviceId: 'mock-camera-2',
        groupId: 'group-1',
        kind: 'videoinput',
        label: 'Mock Camera 2 (Environment)'
      },
      {
        deviceId: 'mock-mic-1',
        groupId: 'group-2',
        kind: 'audioinput',
        label: 'Mock Microphone'
      }
    ];
  }
  
  getSupportedConstraints() {
    return { ...this._supportedConstraints };
  }
  
  // Test helper methods
  _setMockError(error) {
    this._mockError = error;
  }
  
  _setMockDelay(delay) {
    this._mockDelay = delay;
  }
  
  _clearMocks() {
    this._mockError = null;
    this._mockDelay = 0;
  }
}

// Common error types for testing
const CameraErrors = {
  NotAllowedError: class extends Error {
    constructor(message = 'Permission denied') {
      super(message);
      this.name = 'NotAllowedError';
    }
  },
  
  NotFoundError: class extends Error {
    constructor(message = 'Camera not found') {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  
  NotReadableError: class extends Error {
    constructor(message = 'Camera is already in use') {
      super(message);
      this.name = 'NotReadableError';
    }
  },
  
  OverconstrainedError: class extends Error {
    constructor(message = 'Constraints cannot be satisfied') {
      super(message);
      this.name = 'OverconstrainedError';
      this.constraint = 'width';
    }
  },
  
  AbortError: class extends Error {
    constructor(message = 'Operation was aborted') {
      super(message);
      this.name = 'AbortError';
    }
  }
};

// Mock video element
class MockHTMLVideoElement {
  constructor() {
    this.videoWidth = 0;
    this.videoHeight = 0;
    this.srcObject = null;
    this.currentTime = 0;
    this.duration = 0;
    this.paused = true;
    this.ended = false;
    this.volume = 1.0;
    this.muted = false;
    this.playbackRate = 1.0;
    this.readyState = 0; // HAVE_NOTHING
    
    this._eventListeners = {};
    this._loadPromise = null;
    this._playPromise = null;
    
    this.style = {
      filter: 'none'
    };
  }
  
  async play() {
    if (this._playPromise) {
      return this._playPromise;
    }
    
    this._playPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.srcObject) {
          this.paused = false;
          this.readyState = 4; // HAVE_ENOUGH_DATA
          
          // Set video dimensions based on stream
          const videoTrack = this.srcObject.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            this.videoWidth = settings.width || 1280;
            this.videoHeight = settings.height || 720;
          }
          
          this._dispatchEvent('play');
          this._dispatchEvent('loadedmetadata');
          resolve();
        } else {
          reject(new Error('No video source'));
        }
        this._playPromise = null;
      }, 100);
    });
    
    return this._playPromise;
  }
  
  pause() {
    this.paused = true;
    this._dispatchEvent('pause');
  }
  
  load() {
    this.readyState = 1; // HAVE_METADATA
    this._dispatchEvent('loadstart');
    
    setTimeout(() => {
      this.readyState = 4; // HAVE_ENOUGH_DATA
      this._dispatchEvent('loadedmetadata');
      this._dispatchEvent('canplay');
      this._dispatchEvent('canplaythrough');
    }, 50);
  }
  
  addEventListener(event, callback, options) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push({ callback, options });
  }
  
  removeEventListener(event, callback) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(
        listener => listener.callback !== callback
      );
    }
  }
  
  _dispatchEvent(eventType) {
    const listeners = this._eventListeners[eventType] || [];
    const event = { type: eventType, target: this };
    
    listeners.forEach(({ callback }) => {
      if (typeof callback === 'function') {
        callback(event);
      }
    });
  }
  
  // Test helper method
  _simulateVideoReady() {
    this.videoWidth = 1280;
    this.videoHeight = 720;
    this.readyState = 4;
    this._dispatchEvent('loadedmetadata');
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockMediaStream,
    MockMediaStreamTrack,
    MockMediaDevices,
    MockHTMLVideoElement,
    CameraErrors
  };
}

// Global assignments for browser environment
if (typeof global !== 'undefined') {
  global.MediaStream = MockMediaStream;
  global.MediaStreamTrack = MockMediaStreamTrack;
  global.HTMLVideoElement = MockHTMLVideoElement;
  
  if (!global.navigator) {
    global.navigator = {};
  }
  if (!global.navigator.mediaDevices) {
    global.navigator.mediaDevices = new MockMediaDevices();
  }
}

if (typeof window !== 'undefined') {
  window.MediaStream = MockMediaStream;
  window.MediaStreamTrack = MockMediaStreamTrack;
  window.HTMLVideoElement = MockHTMLVideoElement;
  
  if (!window.navigator) {
    window.navigator = {};
  }
  if (!window.navigator.mediaDevices) {
    window.navigator.mediaDevices = new MockMediaDevices();
  }
}