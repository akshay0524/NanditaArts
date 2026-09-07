/* ============================================
   PRODUCT DETAIL PAGE — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    // ── Image gallery with thumbnail strip ──
    const mainImg = document.querySelector('.product-gallery__main img');
    const thumbs = document.querySelectorAll('.product-gallery__thumb');

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', function () {
        const src = this.querySelector('img').src;
        if (mainImg) {
          mainImg.style.transition = 'opacity 200ms ease';
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 200);
        }
        thumbs.forEach(t => t.classList.remove('is-active'));
        this.classList.add('is-active');
      });
    });

    if (thumbs[0]) thumbs[0].classList.add('is-active');

    // ── Zoom on click (lightbox) ──
    const galleryMain = document.querySelector('.product-gallery__main');
    if (galleryMain && mainImg) {
      galleryMain.addEventListener('click', () => {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
          position:fixed; inset:0; z-index:10000;
          background:rgba(0,0,0,0.95);
          display:flex; align-items:center; justify-content:center;
          cursor:zoom-out;
          animation: fadeIn 200ms ease both;
        `;
        const img = document.createElement('img');
        img.src = mainImg.src;
        img.style.cssText = `
          max-width:90vw; max-height:90vh;
          object-fit:contain; border-radius:8px;
          animation: scaleUp 300ms cubic-bezier(0.22,1,0.36,1) both;
        `;
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
          position:absolute; top:24px; right:24px;
          width:44px; height:44px; border-radius:50%;
          background:rgba(255,255,255,0.1); color:white;
          font-size:18px; display:flex; align-items:center; justify-content:center;
          transition: background 150ms;
        `;
        closeBtn.addEventListener('click', () => lightbox.remove());
        lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.remove(); });
        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        document.body.appendChild(lightbox);
        document.addEventListener('keydown', function esc(e) {
          if (e.key === 'Escape') { lightbox.remove(); document.removeEventListener('keydown', esc); }
        });
      });
    }

    // ── Quantity selector ──
    const qtyValue = document.querySelector('.product-info__qty-value');
    const qtyInc = document.querySelector('.product-info__qty-inc');
    const qtyDec = document.querySelector('.product-info__qty-dec');

    if (qtyValue && qtyInc && qtyDec) {
      qtyInc.addEventListener('click', () => {
        qtyValue.textContent = parseInt(qtyValue.textContent) + 1;
      });
      qtyDec.addEventListener('click', () => {
        const current = parseInt(qtyValue.textContent);
        if (current > 1) qtyValue.textContent = current - 1;
      });
    }

    // ── Sticky add-to-cart bar on scroll ──
    const stickyBar = document.querySelector('.product-sticky-bar');
    const addToCartArea = document.querySelector('.product-info__add-to-cart');

    if (stickyBar && addToCartArea) {
      const observer = new IntersectionObserver((entries) => {
        stickyBar.classList.toggle('is-visible', !entries[0].isIntersecting);
      }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
      observer.observe(addToCartArea);
    }

    // ── Load product data from URL param & Server ──
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;

    let product = null;
    try {
      const res = await fetch(`/api/paintings/${productId}`);
      if (res.ok) product = await res.json();
    } catch (e) {
      console.warn('Using local fallback product:', e);
    }

    if (!product) {
      const fallbackList = window.NanditaArts?.allProducts || [];
      product = fallbackList.find(p => p.id === productId) || {
        id: 1,
        title: 'Crimson Reverie',
        category: 'Abstract',
        price: 1200,
        dims: '24×36"',
        medium: 'Acrylic on Canvas',
        img: 'assets/images/p1.jpg',
        description: 'Bold sweeps of deep cadmium red and luminous raw gold, layered with intuitive palette knife strokes to evoke passion, memory, and grounded warmth.'
      };
    }

    if (product) {
      const titleEl = document.querySelector('.product-info__title');
      const categoryEl = document.querySelector('.product-info__category');
      const priceEl = document.querySelector('.product-info__price');
      const dimsEl = document.querySelector('.product-info__dim-val');
      const mediumEl = document.querySelector('.product-info__medium-val');
      const descEl = document.querySelector('.product-info__description');
      const stickyTitle = document.querySelector('.sticky-bar__title');
      const stickyPrice = document.querySelector('.sticky-bar__price');

      if (titleEl) titleEl.textContent = product.title;
      if (categoryEl) categoryEl.textContent = product.category;
      if (priceEl) priceEl.textContent = '$' + product.price.toLocaleString();
      if (dimsEl) dimsEl.textContent = product.dims;
      if (mediumEl) mediumEl.textContent = product.medium;
      if (descEl && product.description) descEl.textContent = product.description;
      if (stickyTitle) stickyTitle.textContent = product.title;
      if (stickyPrice) stickyPrice.textContent = `${product.dims} · $${product.price.toLocaleString()}`;

      if (mainImg) {
        mainImg.src = product.img;
        mainImg.alt = `${product.title} by Nandita Albright`;
      }
      thumbs.forEach(t => {
        const tImg = t.querySelector('img');
        if (tImg) {
          tImg.src = product.img;
          tImg.alt = `${product.title} detail`;
        }
      });

      // Page metadata
      document.title = `${product.title} — Original Fine Art by Nandita Albright`;

      // Add to cart click
      const addBtn = document.getElementById('addToCartBtn');
      if (addBtn) {
        addBtn.onclick = () => {
          const qty = parseInt(qtyValue?.textContent) || 1;
          for (let i = 0; i < qty; i++) {
            window.NanditaArts?.addToCart?.(product);
          }
          window.NanditaArts?.openCart?.();
        };
      }
    }
  });
})();
