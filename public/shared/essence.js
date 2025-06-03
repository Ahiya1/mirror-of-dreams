// Shared Essence - Utilities That Support All Experiences

// Environment
const isDevelopment = () => {
  try {
    return process.env.NODE_ENV === "development";
  } catch {
    return window.location.hostname === "localhost";
  }
};

// Safe logging
const log = (message, data = null) => {
  if (isDevelopment()) {
    if (data) {
      console.log(`🪞 ${message}`, data);
    } else {
      console.log(`🪞 ${message}`);
    }
  }
};

// Safe error logging
const logError = (message, error = null) => {
  if (isDevelopment()) {
    if (error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  }
};

// API helpers
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logError(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// Storage helpers
const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError(`Storage get failed: ${key}`, error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logError(`Storage set failed: ${key}`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logError(`Storage remove failed: ${key}`, error);
      return false;
    }
  },
};

// Animation helpers
const animate = {
  fadeIn: (element, duration = 300) => {
    element.style.opacity = "0";
    element.style.transition = `opacity ${duration}ms ease`;

    requestAnimationFrame(() => {
      element.style.opacity = "1";
    });
  },

  fadeOut: (element, duration = 300) => {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = "0";

    setTimeout(() => {
      element.style.display = "none";
    }, duration);
  },

  slideIn: (element, direction = "up", duration = 300) => {
    const transforms = {
      up: "translateY(20px)",
      down: "translateY(-20px)",
      left: "translateX(20px)",
      right: "translateX(-20px)",
    };

    element.style.opacity = "0";
    element.style.transform = transforms[direction];
    element.style.transition = `all ${duration}ms ease`;

    requestAnimationFrame(() => {
      element.style.opacity = "1";
      element.style.transform = "translate(0)";
    });
  },
};

// Form helpers
const form = {
  validate: {
    email: (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email.trim());
    },

    name: (name) => {
      return name.trim().length > 0;
    },

    required: (value) => {
      return value && value.toString().trim().length > 0;
    },
  },

  serialize: (formElement) => {
    const formData = new FormData(formElement);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  },
};

// Time helpers
const time = {
  ago: (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return then.toLocaleDateString();
  },

  format: (date, locale = "en-US") => {
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};

// URL helpers
const url = {
  getParams: () => {
    return new URLSearchParams(window.location.search);
  },

  getParam: (key, defaultValue = null) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  },

  navigate: (path) => {
    window.location.href = path;
  },

  reload: () => {
    window.location.reload();
  },
};

// Device detection
const device = {
  isMobile: () => {
    return window.innerWidth <= 768;
  },

  isTablet: () => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  },

  isDesktop: () => {
    return window.innerWidth > 1024;
  },

  isTouch: () => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  },
};

// Event helpers
const events = {
  once: (element, event, handler) => {
    element.addEventListener(event, handler, { once: true });
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle: (func, limit) => {
    let lastFunc;
    let lastRan;
    return function executedFunction(...args) {
      if (!lastRan) {
        func(...args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  },
};

// Export for module use (if available)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    log,
    logError,
    apiCall,
    storage,
    animate,
    form,
    time,
    url,
    device,
    events,
  };
}

// Global availability
window.essence = {
  log,
  logError,
  apiCall,
  storage,
  animate,
  form,
  time,
  url,
  device,
  events,
};
