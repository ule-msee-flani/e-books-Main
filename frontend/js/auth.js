/**
 * Authentication Module
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.init();
  }

  init() {
    const token = utils.storage.get('access_token');
    const user = utils.storage.get('user');

    if (token && user) {
      this.user = user;
      this.isAuthenticated = true;
      this.updateUI();
      this.validateSession();
    }

    this.setupLoginForm();
    this.setupRegisterForm();
  }

  async validateSession() {
    try {
      const user = await api.getProfile();
      this.user = user;
      utils.storage.set('user', user);
      this.updateUI();
    } catch (error) {
      this.logout(true); // silent logout (no redirect, no toast)
    }
  }

  setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const formHandler = new ui.FormHandler(form);

    form.addEventListener('formSubmit', async (e) => {
      const { data } = e.detail;

      try {
        formHandler.setLoading(true);

        const response = await api.login(data.email, data.password);

        this.user = response.user;
        this.isAuthenticated = true;
        this.updateUI();

        formHandler.setLoading(false);
        ui.toast.show('Login successful! Redirecting...', 'success');

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/index.html';

        setTimeout(() => {
          window.location.href = redirect;
        }, 600);

      } catch (error) {
        formHandler.setLoading(false);
        ui.toast.show(error.message || 'Login failed. Please check your credentials.', 'error');
      }
    });
  }

  setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const formHandler = new ui.FormHandler(form);

    form.addEventListener('formSubmit', async (e) => {
      const { data } = e.detail;

      if (data.password !== data.confirmPassword) {
        ui.toast.show('Passwords do not match.', 'error');
        const confirmField = form.querySelector('[name="confirmPassword"]');
        if (confirmField) {
          confirmField.style.borderColor = 'var(--error)';
          confirmField.focus();
        }
        return;
      }

      if (!data.terms) {
        ui.toast.show('Please accept the Terms of Service to continue.', 'error');
        return;
      }

      try {
        formHandler.setLoading(true);

        const userData = {
          email: data.email,
          password: data.password,
          confirm_password: data.confirmPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || ''
        };

        const response = await api.register(userData);

        this.user = response.user;
        this.isAuthenticated = true;
        this.updateUI();

        formHandler.setLoading(false);
        ui.toast.show('Account created! Welcome aboard 🎉', 'success');

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 600);

      } catch (error) {
        formHandler.setLoading(false);
        const message = error.message || 'Registration failed. Please try again.';
        ui.toast.show(message, 'error');
      }
    });
  }

  async logout(silent = false) {
    try {
      await api.post('/auth/logout/', { refresh: utils.storage.get('refresh_token') });
    } catch (e) {
      // Ignore — clear client state regardless
    }

    api.logout();
    this.user = null;
    this.isAuthenticated = false;
    this.updateUI();

    if (!silent) {
      ui.toast.show('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
    }
  }

  updateUI() {
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userMenus = document.querySelectorAll('.user-menu');

    authButtons.forEach(el => {
      el.style.display = this.isAuthenticated ? 'none' : 'flex';
    });

    userMenus.forEach(el => {
      el.style.display = this.isAuthenticated ? 'flex' : 'none';
      if (this.user) {
        const nameEl = el.querySelector('.user-name');
        const avatarEl = el.querySelector('.user-avatar');
        const fullName = this.user.full_name || `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim() || 'User';

        if (nameEl) nameEl.textContent = fullName;
        if (avatarEl) avatarEl.textContent = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      }
    });
  }

  requireAuth() {
    if (!this.isAuthenticated) {
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    return true;
  }

  async socialLogin(provider) {
    ui.toast.show(`${provider} login coming soon!`, 'info');
  }
}

window.auth = new AuthManager();