/**
 * API Service Layer - Production Version
 * Connects to Django REST Framework backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class APIClient {
  constructor() {
    this.token = utils.storage.get('access_token');
    this.refreshToken = utils.storage.get('refresh_token');
    this.user = utils.storage.get('user');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // FIX 1: Separate the fetch from the json parse so each failure
    // produces a clear, catchable error with a user-friendly message.
    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      // fetch() itself threw — server is unreachable, no internet, or CORS preflight blocked
      console.error('Network error:', networkError);
      throw new Error('Cannot reach the server. Please check your connection and try again.');
    }

    // FIX 2: Safely parse JSON — server might return HTML (e.g. 500 page) or empty body
    let data = {};
    try {
      const text = await response.text(); // read once as text
      if (text) data = JSON.parse(text);  // only parse if there's content
    } catch (parseError) {
      console.error('Response parse error:', parseError);
      // If we can't parse the body, still respect the HTTP status below
    }

    if (!response.ok) {
      // FIX 3: Handle token refresh on 401
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request(endpoint, options);
        }
      }

      // FIX 4: Extract the most useful error message from DRF's various error shapes:
      // { detail: "..." }  /  { error: "..." }  /  { email: ["..."] }  /  fallback
      const message =
        data.detail ||
        data.error ||
        data.message ||
        this._extractFieldErrors(data) ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;
  }

  // FIX 5: Helper to surface DRF field-level validation errors like
  // { email: ["already exists"], password: ["too short"] }
  _extractFieldErrors(data) {
    if (typeof data !== 'object' || !data) return null;
    const entries = Object.entries(data);
    if (!entries.length) return null;
    return entries
      .map(([field, errors]) => {
        const msg = Array.isArray(errors) ? errors[0] : errors;
        return `${field}: ${msg}`;
      })
      .join(' | ');
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access, this.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.logout();
    return false;
  }

  setTokens(access, refresh) {
    this.token = access;
    this.refreshToken = refresh;
    utils.storage.set('access_token', access, 3600);
    utils.storage.set('refresh_token', refresh, 604800);
  }

  setUser(user) {
    this.user = user;
    utils.storage.set('user', user);
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    utils.storage.remove('access_token');
    utils.storage.remove('refresh_token');
    utils.storage.remove('user');
  }

  async login(email, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: { email, password }
    });
    this.setTokens(data.tokens.access, data.tokens.refresh);
    this.setUser(data.user);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register/', {
      method: 'POST',
      body: userData
    });
    this.setTokens(data.tokens.access, data.tokens.refresh);
    this.setUser(data.user);
    return data;
  }

  async getProfile() {
    return this.request('/auth/me/');
  }

  async updateProfile(profileData) {
    return this.request('/auth/me/', {
      method: 'PUT',
      body: profileData
    });
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); }
  patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

window.api = new APIClient();