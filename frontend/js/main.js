/**
 * Main Application Logic
 */

utils.ready(() => {
  // Initialize all components
  initHeader();
  initSearch();
  initCarousels();
  initCounters();
  initLazyLoading();
  
  // Update auth UI
  if (window.auth) {
    auth.updateUI();
  }
});

// Header scroll behavior
function initHeader() {
  const header = document.querySelector('.nav-header');
  if (!header) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', utils.throttle(() => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, 100));
}

// Global search
function initSearch() {
  const searchInput = document.querySelector('.global-search-input');
  if (!searchInput) return;
  
  const debouncedSearch = utils.debounce(async (query) => {
    if (query.length < 2) return;
    
    // Show suggestions
    try {
      // In real app: const results = await api.get(`/search?q=${query}`);
      console.log('Searching for:', query);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
  
  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}

// Carousels/Sliders
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    let currentIndex = 0;
    const totalSlides = slides.length;
    
    function goToSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Auto-play
    setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  });
}

// Animated counters
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            counter.textContent = target.toLocaleString();
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current).toLocaleString();
          }
        }, 16);
        
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

// Lazy loading images
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Utility: Add to cart
window.addToCart = async (itemId, type = 'ebook') => {
  try {
    await api.post('/cart', { itemId, type, quantity: 1 });
    ui.toast.show('Added to cart!', 'success');
    
    // Update cart count
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      const current = parseInt(cartCount.textContent) || 0;
      cartCount.textContent = current + 1;
    }
  } catch (error) {
    ui.toast.show('Failed to add to cart', 'error');
  }
};

// Utility: Toggle wishlist
window.toggleWishlist = async (itemId) => {
  // Implementation for wishlist toggle
  ui.toast.show('Added to wishlist', 'success');
};