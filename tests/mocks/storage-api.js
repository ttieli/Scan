// Mock implementations for Web Storage APIs (localStorage, sessionStorage)

class MockStorage {
  constructor(name = 'MockStorage') {
    this.name = name;
    this.store = new Map();
    this._quota = 5 * 1024 * 1024; // 5MB default quota
    this._usedSpace = 0;
  }
  
  getItem(key) {
    if (typeof key !== 'string') {
      key = String(key);
    }
    
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }
  
  setItem(key, value) {
    if (typeof key !== 'string') {
      key = String(key);
    }
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    // Calculate size and check quota
    const existingValue = this.store.get(key) || '';
    const sizeChange = value.length - existingValue.length;
    
    if (this._usedSpace + sizeChange > this._quota) {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }
    
    this.store.set(key, value);
    this._usedSpace += sizeChange;
    
    // Dispatch storage event (for testing)
    this._dispatchStorageEvent('setItem', key, existingValue, value);
  }
  
  removeItem(key) {
    if (typeof key !== 'string') {
      key = String(key);
    }
    
    const existingValue = this.store.get(key);
    if (existingValue !== undefined) {
      this.store.delete(key);
      this._usedSpace -= existingValue.length;
      
      // Dispatch storage event
      this._dispatchStorageEvent('removeItem', key, existingValue, null);
    }
  }
  
  clear() {
    const oldStore = new Map(this.store);
    this.store.clear();
    this._usedSpace = 0;
    
    // Dispatch storage event for each cleared item
    for (const [key, value] of oldStore) {
      this._dispatchStorageEvent('clear', key, value, null);
    }
  }
  
  key(index) {
    if (typeof index !== 'number' || index < 0) {
      return null;
    }
    
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
  
  get length() {
    return this.store.size;
  }
  
  // Test helper methods
  _setQuota(quota) {
    this._quota = quota;
  }
  
  _getUsedSpace() {
    return this._usedSpace;
  }
  
  _getQuota() {
    return this._quota;
  }
  
  _dispatchStorageEvent(type, key, oldValue, newValue) {
    // Mock storage event for testing cross-tab scenarios
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new StorageEvent('storage', {
        key,
        oldValue,
        newValue,
        storageArea: this,
        url: window.location?.href || 'https://localhost'
      });
      
      // Dispatch after a microtask to simulate browser behavior
      Promise.resolve().then(() => {
        window.dispatchEvent(event);
      });
    }
  }
  
  // Iterator support for for...of loops
  *[Symbol.iterator]() {
    for (const [key, value] of this.store) {
      yield [key, value];
    }
  }
  
  // Additional methods for compatibility
  valueOf() {
    return this.store;
  }
  
  toString() {
    return `[object ${this.name}]`;
  }
}

// Mock StorageEvent for testing
class MockStorageEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.key = eventInitDict.key || null;
    this.oldValue = eventInitDict.oldValue || null;
    this.newValue = eventInitDict.newValue || null;
    this.url = eventInitDict.url || '';
    this.storageArea = eventInitDict.storageArea || null;
  }
}

// Enhanced mock with error simulation
class MockStorageWithErrors extends MockStorage {
  constructor(name) {
    super(name);
    this._shouldThrowError = false;
    this._errorToThrow = null;
    this._readOnlyMode = false;
  }
  
  getItem(key) {
    if (this._shouldThrowError) {
      throw this._errorToThrow || new Error('Storage access error');
    }
    return super.getItem(key);
  }
  
  setItem(key, value) {
    if (this._shouldThrowError) {
      throw this._errorToThrow || new Error('Storage write error');
    }
    if (this._readOnlyMode) {
      const error = new Error('Storage is read-only');
      error.name = 'InvalidAccessError';
      throw error;
    }
    return super.setItem(key, value);
  }
  
  removeItem(key) {
    if (this._shouldThrowError) {
      throw this._errorToThrow || new Error('Storage access error');
    }
    if (this._readOnlyMode) {
      const error = new Error('Storage is read-only');
      error.name = 'InvalidAccessError';
      throw error;
    }
    return super.removeItem(key);
  }
  
  clear() {
    if (this._shouldThrowError) {
      throw this._errorToThrow || new Error('Storage access error');
    }
    if (this._readOnlyMode) {
      const error = new Error('Storage is read-only');
      error.name = 'InvalidAccessError';
      throw error;
    }
    return super.clear();
  }
  
  // Test control methods
  _setErrorMode(shouldThrow, errorToThrow = null) {
    this._shouldThrowError = shouldThrow;
    this._errorToThrow = errorToThrow;
  }
  
  _setReadOnlyMode(readOnly) {
    this._readOnlyMode = readOnly;
  }
  
  _clearErrorMode() {
    this._shouldThrowError = false;
    this._errorToThrow = null;
    this._readOnlyMode = false;
  }
}

// Utility functions for creating test data
const StorageTestUtils = {
  createSessionData(id, data, timestamp = new Date()) {
    return {
      id,
      timestamp: timestamp.toISOString(),
      type: 'text',
      data,
      size: data.length
    };
  },
  
  createManualSessionData(id, data, timestamp = new Date()) {
    return {
      id,
      timestamp: timestamp.toISOString(),
      type: 'text',
      data,
      size: data.length,
      manual: true
    };
  },
  
  populateStorage(storage, sessions) {
    sessions.forEach(session => {
      storage.setItem(session.id, JSON.stringify(session));
    });
  },
  
  createLargeData(sizeInBytes) {
    return 'x'.repeat(sizeInBytes);
  },
  
  simulateQuotaExceededError(storage, smallQuota = 1024) {
    storage._setQuota(smallQuota);
    return () => {
      storage.setItem('large-data', 'x'.repeat(smallQuota + 1));
    };
  }
};

// Factory for creating configured mock storage instances
const StorageFactory = {
  createLocalStorage(options = {}) {
    const storage = options.withErrors 
      ? new MockStorageWithErrors('MockLocalStorage')
      : new MockStorage('MockLocalStorage');
    
    if (options.quota) {
      storage._setQuota(options.quota);
    }
    
    if (options.initialData) {
      StorageTestUtils.populateStorage(storage, options.initialData);
    }
    
    return storage;
  },
  
  createSessionStorage(options = {}) {
    const storage = options.withErrors
      ? new MockStorageWithErrors('MockSessionStorage') 
      : new MockStorage('MockSessionStorage');
    
    if (options.quota) {
      storage._setQuota(options.quota);
    }
    
    if (options.initialData) {
      StorageTestUtils.populateStorage(storage, options.initialData);
    }
    
    return storage;
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockStorage,
    MockStorageWithErrors,
    MockStorageEvent,
    StorageTestUtils,
    StorageFactory
  };
}

// Global assignments for browser environment
if (typeof global !== 'undefined') {
  global.MockStorage = MockStorage;
  global.StorageEvent = MockStorageEvent;
  global.localStorage = new MockStorage('localStorage');
  global.sessionStorage = new MockStorage('sessionStorage');
}

if (typeof window !== 'undefined') {
  window.MockStorage = MockStorage;
  window.StorageEvent = MockStorageEvent;
  if (!window.localStorage) {
    window.localStorage = new MockStorage('localStorage');
  }
  if (!window.sessionStorage) {
    window.sessionStorage = new MockStorage('sessionStorage');
  }
}