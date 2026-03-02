/**
 * UI Components and Interactions
 */

// Toast Notification System
class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span style="font-size: 1.25rem;">${icons[type] || 'ℹ'}</span>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.25rem; color: var(--gray-400);">×</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

// Modal Manager
class ModalManager {
  constructor() {
    this.activeModal = null;
  }

  create(options = {}) {
    const {
      title = '',
      content = '',
      footer = '',
      onClose = () => {},
      size = 'md'
    } = options;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    if (size === 'lg') modal.style.maxWidth = '800px';
    if (size === 'sm') modal.style.maxWidth = '400px';

    modal.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size: 1.25rem; font-weight: 600;">${title}</h3>
        <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--gray-400);">×</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        onClose();
      }, 300);
    };

    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    requestAnimationFrame(() => overlay.classList.add('active'));
    this.activeModal = overlay;

    return { close, element: overlay };
  }
}

// Theme Manager
class ThemeManager {
  constructor() {
    this.currentTheme = utils.storage.get('theme') || 'light';
    this.init();
  }

  init() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    utils.storage.set('theme', this.currentTheme);
    return this.currentTheme;
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    utils.storage.set('theme', theme);
  }
}

// Mobile Menu Manager
class MobileMenuManager {
  constructor() {
    this.menu = null;
    this.isOpen = false;
  }

  toggle() {
    if (!this.menu) this.create();
    this.isOpen = !this.isOpen;
    this.menu.classList.toggle('active', this.isOpen);
    document.body.style.overflow = this.isOpen ? 'hidden' : '';
  }

  create() {
    const user = utils.storage.get('user');

    this.menu = document.createElement('div');
    this.menu.className = 'mobile-menu';
    this.menu.innerHTML = `
      <div class="mobile-menu-header">
        <a href="/index.html" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">
          📚 BookMarket
        </a>
        <button onclick="window.ui.mobileMenu.toggle()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">
          ✕
        </button>
      </div>
      <div class="mobile-menu-body">
        <nav style="display: flex; flex-direction: column; gap: var(--space-2);">
          <a href="/index.html" class="mobile-menu-item">
            <span>🏠</span> Home
          </a>
          ${user ? `
            <button onclick="window.auth.logout()" class="mobile-menu-item" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer;">
              <span>🚪</span> Logout
            </button>
          ` : `
            <a href="/pages/login.html" class="mobile-menu-item">
              <span>🔑</span> Login
            </a>
            <a href="/pages/register.html" class="mobile-menu-item">
              <span>📝</span> Register
            </a>
          `}
        </nav>

        <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--gray-200);">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-4);">
            <span>Dark Mode</span>
            <button class="theme-toggle ${window.ui.theme.currentTheme === 'dark' ? 'active' : ''}" onclick="window.ui.theme.toggle(); this.classList.toggle('active')">
              <div class="theme-toggle-slider">
                ${window.ui.theme.currentTheme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.menu);
  }

  close() {
    if (this.isOpen) this.toggle();
  }
}

// Form Handler
class FormHandler {
  constructor(formElement) {
    this.form = formElement;
    this.fields = {};
    this.errors = {};
    this.loading = false;
    this.init();
  }

  init() {
    this.form.querySelectorAll('input, select, textarea').forEach(field => {
      if (field.name) {
        this.fields[field.name] = field;
      }
    });

    Object.values(this.fields).forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearError(field));
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateField(field) {
    const value = field.value;
    const validations = field.dataset.validate?.split(',').map(v => v.trim()) || [];
    let error = null;

    for (const validation of validations) {
      if (utils.validators[validation]) {
        error = utils.validators[validation](value);
        if (error) break;
      }
    }

    if (error) {
      this.showError(field, error);
      return false;
    }

    this.clearError(field);
    return true;
  }

  validateAll() {
    let isValid = true;
    Object.values(this.fields).forEach(field => {
      if (!this.validateField(field)) isValid = false;
    });
    return isValid;
  }

  showError(field, message) {
    this.clearError(field);
    field.style.borderColor = 'var(--error)';

    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;

    const wrapper = field.closest('.form-group') || field.parentNode;
    wrapper.appendChild(errorEl);

    this.errors[field.name] = message;
  }

  clearError(field) {
    field.style.borderColor = '';

    const wrapper = field.closest('.form-group') || field.parentNode;
    const errorEl = wrapper.querySelector('.form-error');
    if (errorEl) errorEl.remove();

    delete this.errors[field.name];
  }

  getData() {
    const data = {};
    Object.entries(this.fields).forEach(([name, field]) => {
      if (field.type === 'checkbox') {
        data[name] = field.checked;
      } else if (field.type === 'file') {
        data[name] = field.files;
      } else {
        data[name] = field.value;
      }
    });
    return data;
  }

  setLoading(loading) {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (loading && !submitBtn.dataset.originalText) {
      submitBtn.dataset.originalText = submitBtn.textContent.trim();
    }

    this.loading = loading;
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<div class="spinner" style="display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; margin-right:8px; vertical-align:middle;"></div> Processing...'
      : (submitBtn.dataset.originalText || 'Submit');
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.loading) return;

    if (!this.validateAll()) return;

    const submitEvent = new CustomEvent('formSubmit', {
      detail: { data: this.getData(), form: this },
      bubbles: false,
      cancelable: true
    });

    this.form.dispatchEvent(submitEvent);
  }

  reset() {
    this.form.reset();
    Object.values(this.fields).forEach(field => this.clearError(field));
  }
}

// Add spinner keyframe if not already present
if (!document.getElementById('ui-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'ui-spinner-style';
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// Initialize UI managers
window.ui = {
  toast: new ToastManager(),
  modal: new ModalManager(),
  theme: new ThemeManager(),
  mobileMenu: new MobileMenuManager(),
  FormHandler
};