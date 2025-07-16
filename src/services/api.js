// services/api.js - Base API client with common configurations (FIXED)

import { STORAGE_KEYS, RESPONSE_MESSAGES } from "../utils/constants";
import { storageService } from "./storage.service";

class ApiClient {
  constructor(baseURL = "") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Get authorization header with current token
   * @returns {Object} - Authorization header object
   */
  getAuthHeaders() {
    // FIX: Use storageService instead of direct localStorage access
    const token = storageService.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Base request method with error handling and token management
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} - API response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new ApiError(RESPONSE_MESSAGES.NETWORK_ERROR, 0);
      }

      // Handle timeout errors
      if (error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }

      throw new ApiError(error.message || RESPONSE_MESSAGES.GENERIC_ERROR, 500);
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: "GET",
    });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} - API response
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} - API response
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - API response
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  /**
   * File upload request
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with files
   * @returns {Promise} - API response
   */
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
  }

  /**
   * Request with timeout
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} - API response
   */
  async requestWithTimeout(endpoint, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.request(endpoint, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Retry request with exponential backoff
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} - API response
   */
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;

        // Don't retry client errors (4xx) except 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on the last attempt
        if (i === maxRetries) {
          throw error;
        }

        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /**
   * Check if error is authentication related
   * @returns {boolean}
   */
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is network related
   * @returns {boolean}
   */
  isNetworkError() {
    return this.status === 0 || this.status >= 500;
  }

  /**
   * Check if error is client related
   * @returns {boolean}
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Get user-friendly error message
   * @returns {string}
   */
  getUserMessage() {
    if (this.isAuthError()) {
      return RESPONSE_MESSAGES.AUTH_REQUIRED;
    }

    if (this.isNetworkError()) {
      return RESPONSE_MESSAGES.NETWORK_ERROR;
    }

    if (this.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }

    return this.message || RESPONSE_MESSAGES.GENERIC_ERROR;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export default ApiClient;
