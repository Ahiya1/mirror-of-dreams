// services/storage.service.js - Local and session storage management

import { STORAGE_KEYS, CACHE_DURATION } from "../utils/constants";

class StorageService {
  /**
   * Set item in localStorage with optional expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   */
  setLocal(key, value, ttl = null) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn("LocalStorage not available:", error);
    }
  }

  /**
   * Get item from localStorage with expiration check
   * @param {string} key - Storage key
   * @returns {any} - Stored value or null
   */
  getLocal(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);

      // Check if item has expired
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.removeLocal(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn("Error reading from localStorage:", error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Error removing from localStorage:", error);
    }
  }

  /**
   * Clear all localStorage items
   */
  clearLocal() {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn("Error clearing localStorage:", error);
    }
  }

  /**
   * Set item in sessionStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setSession(key, value) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn("SessionStorage not available:", error);
    }
  }

  /**
   * Get item from sessionStorage
   * @param {string} key - Storage key
   * @returns {any} - Stored value or null
   */
  getSession(key) {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      return item.value;
    } catch (error) {
      console.warn("Error reading from sessionStorage:", error);
      return null;
    }
  }

  /**
   * Remove item from sessionStorage
   * @param {string} key - Storage key
   */
  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn("Error removing from sessionStorage:", error);
    }
  }

  /**
   * Clear all sessionStorage items
   */
  clearSession() {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn("Error clearing sessionStorage:", error);
    }
  }

  /**
   * Store auth token with long expiration
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    this.setLocal(STORAGE_KEYS.AUTH_TOKEN, token, CACHE_DURATION.USER_SESSION);
  }

  /**
   * Get auth token
   * @returns {string|null} - JWT token or null
   */
  getAuthToken() {
    return this.getLocal(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Remove auth token
   */
  removeAuthToken() {
    this.removeLocal(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Store form state for specific user
   * @param {string} userId - User ID
   * @param {Object} formData - Form state data
   */
  setFormState(userId, formData) {
    if (!userId) return;

    const key = `${STORAGE_KEYS.FORM_STATE}_${userId}`;
    const state = {
      ...formData,
      userId,
      timestamp: Date.now(),
    };

    this.setSession(key, state);
  }

  /**
   * Get form state for specific user
   * @param {string} userId - User ID
   * @returns {Object|null} - Form state or null
   */
  getFormState(userId) {
    if (!userId) return null;

    const key = `${STORAGE_KEYS.FORM_STATE}_${userId}`;
    const state = this.getSession(key);

    if (!state) return null;

    // Security check - ensure user ID matches
    if (state.userId !== userId) {
      this.removeFormState(userId);
      return null;
    }

    // Check if state is too old
    const age = Date.now() - state.timestamp;
    if (age > CACHE_DURATION.FORM_STATE) {
      this.removeFormState(userId);
      return null;
    }

    return state;
  }

  /**
   * Remove form state for specific user
   * @param {string} userId - User ID
   */
  removeFormState(userId) {
    if (!userId) return;

    const key = `${STORAGE_KEYS.FORM_STATE}_${userId}`;
    this.removeSession(key);
  }

  /**
   * Clear all form states (for security)
   */
  clearAllFormStates() {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEYS.FORM_STATE)) {
          this.removeSession(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing form states:", error);
    }
  }

  /**
   * Store user preferences
   * @param {Object} preferences - User preferences
   */
  setUserPreferences(preferences) {
    this.setLocal("user_preferences", preferences);
  }

  /**
   * Get user preferences
   * @returns {Object|null} - User preferences or null
   */
  getUserPreferences() {
    return this.getLocal("user_preferences");
  }

  /**
   * Check if storage is available
   * @param {string} type - 'localStorage' or 'sessionStorage'
   * @returns {boolean} - Whether storage is available
   */
  isStorageAvailable(type = "localStorage") {
    try {
      const storage = window[type];
      const testKey = "__storage_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} - Storage usage stats
   */
  getStorageInfo() {
    const info = {
      localStorage: {
        available: this.isStorageAvailable("localStorage"),
        used: 0,
        keys: 0,
      },
      sessionStorage: {
        available: this.isStorageAvailable("sessionStorage"),
        used: 0,
        keys: 0,
      },
    };

    try {
      // Calculate localStorage usage
      if (info.localStorage.available) {
        let localSize = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            localSize += localStorage[key].length;
          }
        }
        info.localStorage.used = localSize;
        info.localStorage.keys = localStorage.length;
      }

      // Calculate sessionStorage usage
      if (info.sessionStorage.available) {
        let sessionSize = 0;
        for (let key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            sessionSize += sessionStorage[key].length;
          }
        }
        info.sessionStorage.used = sessionSize;
        info.sessionStorage.keys = sessionStorage.length;
      }
    } catch (error) {
      console.warn("Error calculating storage info:", error);
    }

    return info;
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    try {
      // Clean up localStorage
      Object.keys(localStorage).forEach((key) => {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (item.ttl && Date.now() - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid JSON, remove the item
          localStorage.removeItem(key);
        }
      });

      // Clean up old form states from sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEYS.FORM_STATE)) {
          try {
            const itemStr = sessionStorage.getItem(key);
            if (itemStr) {
              const item = JSON.parse(itemStr);
              const age = Date.now() - item.value.timestamp;
              if (age > CACHE_DURATION.FORM_STATE) {
                sessionStorage.removeItem(key);
              }
            }
          } catch (error) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn("Error during storage cleanup:", error);
    }
  }
}

// Create and export singleton instance
export const storageService = new StorageService();

// Export class for testing
export default StorageService;
