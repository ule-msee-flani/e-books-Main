/**
 * Utility Functions
 */

// DOM Ready
const ready = (fn) => {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
};

// Debounce
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Format Currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format Date
const formatDate = (date, options = {}) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
};

// LocalStorage with expiration
const storage = {
  set: (key, value, ttl = null) => {
    try {
      const item = {
        value: value,
        created: Date.now(),
        ttl: ttl ? ttl * 1000 : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Storage set failed:', e);
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (parsed.ttl && Date.now() - parsed.created > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.value;
    } catch (e) {
      console.warn('Storage get failed:', e);
      return null;
    }
  },

  remove: (key) => {
    try { localStorage.removeItem(key); } catch (e) {}
  },

  clear: () => {
    try { localStorage.clear(); } catch (e) {}
  }
};

// Form validation
const validators = {
  email: (value) => {
    if (!value || !value.trim()) return 'Please enter a valid email address';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim()) ? null : 'Please enter a valid email address';
  },

  password: (value) => {
    if (!value) return 'Password must be at least 8 characters';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain a number';
    return null;
  },

  required: (value) => {
    return (value && value.trim()) ? null : 'This field is required';
  },

  // FIX: phone is optional — only validate if a value is actually entered
  phone: (value) => {
    if (!value || !value.trim()) return null; // empty = OK (field is optional)
    const re = /^[\d\s\-\+\(\)]+$/;
    const digits = value.replace(/\D/g, '');
    return (re.test(value) && digits.length >= 10)
      ? null
      : 'Please enter a valid phone number';
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Deep clone
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Export
window.utils = {
  ready,
  debounce,
  throttle,
  formatCurrency,
  formatDate,
  storage,
  validators,
  generateId,
  deepClone
};