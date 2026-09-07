/* ============================================
   NAVIGATION — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchClose = document.querySelector('.search-overlay__close');
  const searchInput = document.querySelector('.search-overlay__input');
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartBackdrop = document.querySelector('.cart-drawer__backdrop');
  const announcementClose = document.querySelector('.announcement-bar__close');
  const announcementBar = document.querySelector('.announcement-bar');

  // ── Mobile nav backdrop (injected once, reused) ──
  let mobileNavBackdrop = null;
  function ensureMobileBackdrop() {
    if (mobileNavBackdrop) return mobileNavBackdrop;
    mobileNavBackdrop = document.createElement('div');
    mobileNavBackdrop.className = 'nav__mobile-backdrop';
    document.body.appendChild(mobileNavBackdrop);
    mobileNavBackdrop.addEventListener('click', closeMobileMenu);
    return mobileNavBackdrop;
  }

  // ── Announcement bar ──
  if (announcementClose && announcementBar) {
    announcementClose.addEventListener('click', () => {
      announcementBar.style.transition = 'height 300ms ease, opacity 300ms ease, padding 300ms ease';
      announcementBar.style.height = announcementBar.offsetHeight + 'px';
      requestAnimationFrame(() => {
        announcementBar.style.height = '0';
        announcementBar.style.opacity = '0';
        announcementBar.style.paddingBlock = '0';
        announcementBar.style.overflow = 'hidden';
      });
      setTimeout(() => {
        announcementBar.remove();
        if (nav) {
          nav.classList.remove('has-announcement');
          nav.style.top = '';
        }
      }, 320);
    });
  }

  // ── Scroll-based navbar ──
  if (nav) {
    let ticking = false;
    const SCROLL_THRESHOLD = 60;

    function updateNav() {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      nav.classList.toggle('is-scrolled', scrolled);
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });

    updateNav();
  }

  // ── Mobile hamburger ──
  function openMobileMenu() {
    hamburger.classList.add('is-open');
    mobileNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const bd = ensureMobileBackdrop();
    // Show backdrop on next frame so the transition fires
    requestAnimationFrame(() => bd.classList.add('is-open'));
  }

  function closeMobileMenu() {
    hamburger.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
    if (mobileNavBackdrop) mobileNavBackdrop.classList.remove('is-open');
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('is-open');
      if (isOpen) { closeMobileMenu(); } else { openMobileMenu(); }
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // ── Swipe-left-to-close gesture ──
    let swipeTouchStartX = 0;
    let swipeTouchStartY = 0;

    mobileNav.addEventListener('touchstart', (e) => {
      swipeTouchStartX = e.touches[0].clientX;
      swipeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    mobileNav.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - swipeTouchStartX;
      const dy = e.changedTouches[0].clientY - swipeTouchStartY;
      // Only treat as swipe if horizontal movement dominates and exceeds threshold
      if (dx > 60 && Math.abs(dy) < Math.abs(dx)) {
        closeMobileMenu();
      }
    }, { passive: true });
  }

  // ── Search overlay ──
  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput && searchInput.focus(), 100);
  }
  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchOverlay) {
    searchOverlay.addEventListener('click', e => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  // ── Cart drawer ──
  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    if (cartBackdrop) cartBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    if (cartBackdrop) cartBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  const cartCloseBtn = document.querySelector('.cart-drawer__close');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);

  // ── Keyboard shortcuts ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSearch();
      closeCart();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // ── Active link highlighting ──
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('is-active');
    }
  });

  // Expose cart functions globally
  window.NanditaArts = window.NanditaArts || {};
  window.NanditaArts.openCart = openCart;
  window.NanditaArts.closeCart = closeCart;
})();
