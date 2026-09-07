/* ============================================
   SCROLL ANIMATIONS — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  // ── Mobile / touch detection helpers ──
  const isTouchDevice = () => window.matchMedia('(hover: none)').matches;
  const isMobileWidth = () => window.innerWidth <= 640;

  // ── IntersectionObserver for reveal animations ──
  const REVEAL_CLASSES = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale'];

  function initReveal() {
    const elements = document.querySelectorAll(REVEAL_CLASSES.join(', '));
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  // ── Parallax backgrounds ──
  function initParallax() {
    // Disable entirely on touch/mobile — scroll-linked transforms cause jank on mobile GPUs
    if (isTouchDevice()) return;

    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!parallaxEls.length) return;

    let ticking = false;

    function updateParallax() {
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const centerY = rect.top + rect.height / 2;
        const viewportCenterY = window.innerHeight / 2;
        const offset = (centerY - viewportCenterY) * speed;
        const img = el.querySelector('img') || el;
        img.style.transform = `translateY(${offset}px) translateZ(0)`;
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    updateParallax();
  }

  // ── Animated counter ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.target || el.textContent, 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => {
      el.dataset.target = parseInt(el.textContent, 10);
      el.textContent = '0' + (el.dataset.suffix || '');
      observer.observe(el);
    });
  }

  // ── Animated SVG brushstroke signature ──
  function initSignature() {
    const sig = document.querySelector('.about-content__signature');
    if (!sig) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sig.classList.add('is-visible');
          observer.unobserve(sig);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(sig);
  }

  // ── Button ripple effect ──
  function initRipple() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'btn__ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
          width: ${size}px; height: ${size}px;
          top: ${y - size / 2}px; left: ${x - size / 2}px;
        `;
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  // ── Accordion ──
  function initAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', function () {
        const item = this.closest('.accordion-item');
        const body = item.querySelector('.accordion-body');
        const isOpen = this.classList.contains('is-open');

        // Close others in same accordion
        const accordion = item.closest('.accordion');
        accordion.querySelectorAll('.accordion-trigger.is-open').forEach(t => {
          if (t !== this) {
            t.classList.remove('is-open');
            t.closest('.accordion-item').querySelector('.accordion-body').classList.remove('is-open');
          }
        });

        this.classList.toggle('is-open', !isOpen);
        body.classList.toggle('is-open', !isOpen);
      });
    });
  }

  // ── Sticky "Add to Cart" on product page ──
  function initStickyCart() {
    const stickyBar = document.querySelector('.product-sticky-bar');
    const productInfo = document.querySelector('.product-info');
    if (!stickyBar || !productInfo) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });

    observer.observe(productInfo.querySelector('.product-info__add-to-cart') || productInfo);
  }

  // ── Toast utility ──
  window.NanditaArts = window.NanditaArts || {};
  window.NanditaArts.showToast = function (message, type = 'success', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success'
      ? `<svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <polyline points="20 6 9 17 4 12"/>
         </svg>`
      : `<svg class="toast__icon toast__icon--error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/>
         </svg>`;
    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-hiding');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  };

  // ── Touch-Tap Quick-View Toggle (mobile: tap card to reveal quick-view button) ──
  function initTouchQuickView() {
    if (!isTouchDevice()) return;

    document.addEventListener('touchend', (e) => {
      const card = e.target.closest('.product-card');
      // If tapped outside any card, close all
      if (!card) {
        document.querySelectorAll('.product-card.is-touch-active').forEach(c => {
          c.classList.remove('is-touch-active');
        });
        return;
      }
      // If tapped a quick-view button or wishlist, don't toggle card state
      if (e.target.closest('.product-card__quick-btn') || e.target.closest('.product-card__wishlist')) return;

      const wasActive = card.classList.contains('is-touch-active');
      // Close all others
      document.querySelectorAll('.product-card.is-touch-active').forEach(c => {
        c.classList.remove('is-touch-active');
      });
      if (!wasActive) card.classList.add('is-touch-active');
    }, { passive: true });
  }

  // ── 3D Physical Tilt & Canvas Lift for Product Cards ──
  function initCardTilt(container = document) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Disable on any touch/pointer:coarse device — not just narrow screens
    if (isTouchDevice()) return;

    const cards = container.querySelectorAll('.product-card:not([data-tilt-bound])');
    cards.forEach(card => {
      card.setAttribute('data-tilt-bound', 'true');
      let rafId = null;

      function onMouseMove(e) {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const tiltX = (0.5 - y) * 9; // up to ~4.5 deg tilt
        const tiltY = (x - 0.5) * 9;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        });
      }

      function onMouseLeave() {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = '';
      }

      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }

  // ── Drag-to-Scroll Row with Elastic Rubber-Band Physics ──
  function initDragScroll(selector = '#categoryTabs, .drag-scroll-row') {
    const containers = document.querySelectorAll(selector);
    containers.forEach(slider => {
      if (slider.hasAttribute('data-drag-bound')) return;
      slider.setAttribute('data-drag-bound', 'true');

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;
      let overscroll = 0;

      // Don't apply grab cursor on touch devices — it shows a forbidden icon on some Android browsers
      if (!isTouchDevice()) {
        slider.style.cursor = 'grab';
      }
      slider.style.userSelect = 'none';

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        moved = false;
        overscroll = 0;
        if (!isTouchDevice()) slider.style.cursor = 'grabbing';
        slider.style.scrollBehavior = 'auto';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        if (!isTouchDevice()) slider.style.cursor = 'grab';

        // Rubber-band snapback with spring transition
        if (overscroll !== 0) {
          slider.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
          slider.style.transform = 'translateX(0px)';
          overscroll = 0;
          setTimeout(() => {
            slider.style.transition = '';
          }, 420);
        }
      });

      slider.addEventListener('mouseleave', () => {
        if (isDown) {
          isDown = false;
          if (!isTouchDevice()) slider.style.cursor = 'grab';
          if (overscroll !== 0) {
            slider.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            slider.style.transform = 'translateX(0px)';
            overscroll = 0;
            setTimeout(() => {
              slider.style.transition = '';
            }, 420);
          }
        }
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 4) moved = true;

        const maxScroll = slider.scrollWidth - slider.clientWidth;
        const targetScroll = scrollLeft - walk;

        if (targetScroll < 0) {
          // Elastic pull at left edge
          overscroll = Math.max(-45, -Math.sqrt(Math.abs(targetScroll)) * 3.5);
          slider.style.transform = `translateX(${-overscroll}px)`;
          slider.scrollLeft = 0;
        } else if (targetScroll > maxScroll && maxScroll > 0) {
          // Elastic pull at right edge
          const extra = targetScroll - maxScroll;
          overscroll = Math.min(45, Math.sqrt(extra) * 3.5);
          slider.style.transform = `translateX(${-overscroll}px)`;
          slider.scrollLeft = maxScroll;
        } else {
          slider.style.transform = '';
          slider.scrollLeft = targetScroll;
        }
      });

      // Prevent child button clicks if user dragged
      slider.addEventListener('click', (e) => {
        if (moved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    });
  }

  // ── Brand Mascot Floating & Micro-Wiggle ──
  function initBrandMark() {
    document.querySelectorAll('.brand-mark').forEach(mark => {
      mark.addEventListener('mouseenter', () => {
        mark.style.animation = 'none';
        mark.offsetHeight; // reflow
        mark.style.animation = 'badgePop 400ms var(--ease-bounce)';
      });
      mark.addEventListener('animationend', () => {
        mark.style.animation = 'brandBreathe 3.2s ease-in-out infinite';
      });
    });
  }

  // ── Bold Editorial Section Scroll Parallax, Category Focus & Dynamic Corner Swaps ──
  // ── Bold Editorial Section Scroll Parallax, Category Focus & Dynamic Corner Reveal ──
  function initEditorialParallax() {
    const section = document.querySelector('.editorial-category-section');
    if (!section) return;

    const wraps = Array.from(section.querySelectorAll('.editorial-polaroid-wrap'));
    const items = Array.from(section.querySelectorAll('.editorial-cat-item'));
    const links = Array.from(section.querySelectorAll('.editorial-cat-link'));
    if (!wraps.length || !items.length) return;

    // 1. Preload all studio images for instantaneous zero-latency reveals
    const ALL_STUDIO_IMAGES = [
      'assets/images/p1.jpg',
      'assets/images/p2.jpg',
      'assets/images/p3.jpg',
      'assets/images/p4.jpg',
      'assets/images/p5.jpg',
      'assets/images/p6.jpg',
      'assets/images/p7.jpg',
      'assets/images/landscape2.jpg',
      'assets/images/floral2.jpg',
      'assets/images/hero.jpg'
    ];
    ALL_STUDIO_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // 2. Verified Authentic Product Lookup: Every image strictly belongs to its declared category.
    // src and caption are ALWAYS pulled from the same single product object.
    const CATEGORY_DATA = {
      'abstract': [
        { title: 'Crimson Reverie', img: 'assets/images/p1.jpg', cat: 'Abstract' },
        { title: 'Jazz Composition', img: 'assets/images/p5.jpg', cat: 'Abstract' },
        { title: 'Pollock Dreams', img: 'assets/images/hero.jpg', cat: 'Abstract' },
        { title: 'Cadmium Sunset', img: 'assets/images/p1.jpg', cat: 'Abstract' }
      ],
      'landscape': [
        { title: 'Golden Meadow', img: 'assets/images/p6.jpg', cat: 'Landscape' },
        { title: 'Coastal Morning Mist', img: 'assets/images/landscape2.jpg', cat: 'Landscape' },
        { title: 'Sunlit Valley', img: 'assets/images/p6.jpg', cat: 'Landscape' },
        { title: 'Highland Mist', img: 'assets/images/landscape2.jpg', cat: 'Landscape' }
      ],
      'flower': [
        { title: 'Bloom & Scatter', img: 'assets/images/p3.jpg', cat: 'Flower' },
        { title: 'Botanical Harmony', img: 'assets/images/floral2.jpg', cat: 'Flower' },
        { title: 'Studio Garden Peonies', img: 'assets/images/p3.jpg', cat: 'Flower' },
        { title: 'Wild Dahlia Cascade', img: 'assets/images/floral2.jpg', cat: 'Flower' }
      ],
      'cityscape': [
        { title: 'Urban Nocturne', img: 'assets/images/p2.jpg', cat: 'Cityscape' },
        { title: 'Metropolitan Rain', img: 'assets/images/p2.jpg', cat: 'Cityscape' },
        { title: 'Downtown Twilight', img: 'assets/images/p2.jpg', cat: 'Cityscape' },
        { title: 'City Lights', img: 'assets/images/p2.jpg', cat: 'Cityscape' }
      ],
      'seascape': [
        { title: 'Oceanic Drift', img: 'assets/images/p4.jpg', cat: 'Seascape' },
        { title: 'Pacific Breakers', img: 'assets/images/p4.jpg', cat: 'Seascape' },
        { title: 'Coastal Tide', img: 'assets/images/p4.jpg', cat: 'Seascape' },
        { title: 'Sunlit Foam', img: 'assets/images/p4.jpg', cat: 'Seascape' }
      ],
      'texture': [
        { title: 'Textured Silence', img: 'assets/images/p7.jpg', cat: 'Texture' },
        { title: 'Raw Pigment Knife', img: 'assets/images/p7.jpg', cat: 'Texture' },
        { title: 'Sculptural Relief', img: 'assets/images/p7.jpg', cat: 'Texture' },
        { title: 'Earth & Plaster', img: 'assets/images/p7.jpg', cat: 'Texture' }
      ],
      'jackson pollock style': [
        { title: 'Pollock Dreams', img: 'assets/images/hero.jpg', cat: 'Jackson Pollock Style' },
        { title: 'Linear Action Web', img: 'assets/images/hero.jpg', cat: 'Jackson Pollock Style' },
        { title: 'Drip Composition', img: 'assets/images/hero.jpg', cat: 'Jackson Pollock Style' },
        { title: 'Visceral Gesture', img: 'assets/images/hero.jpg', cat: 'Jackson Pollock Style' }
      ],
      'giclée prints': [
        { title: 'Giclée Reverie I', img: 'assets/images/p4.jpg', cat: 'Giclée Prints' },
        { title: 'Archival Jazz Print', img: 'assets/images/p5.jpg', cat: 'Giclée Prints' },
        { title: 'Botanical Edition', img: 'assets/images/p3.jpg', cat: 'Giclée Prints' },
        { title: 'Golden Field Edition', img: 'assets/images/p6.jpg', cat: 'Giclée Prints' }
      ]
    };

    // Which corner polaroid slots are active for each category line:
    // Slot 0: Top Left, Slot 1: Top Right, Slot 2: Mid Left, Slot 3: Mid Right, Slot 4: Lower Left, Slot 5: Lower Right
    const CATEGORY_SLOTS = {
      'abstract': [0, 1],
      'landscape': [1, 2],
      'flower': [2, 3],
      'cityscape': [2, 3],
      'seascape': [3, 4],
      'texture': [3, 4],
      'jackson pollock style': [4, 5],
      'giclée prints': [4, 5]
    };

    function normalizeCategory(raw) {
      if (!raw) return '';
      const clean = raw.toLowerCase().trim();
      if (clean.includes('flower') || clean.includes('floral') || clean.includes('botanical')) return 'flower';
      if (clean.includes('seascape') || clean.includes('ocean')) return 'seascape';
      if (clean.includes('landscape')) return 'landscape';
      if (clean.includes('cityscape')) return 'cityscape';
      if (clean.includes('pollock')) return 'jackson pollock style';
      if (clean.includes('giclée') || clean.includes('giclee') || clean.includes('print')) return 'giclée prints';
      if (clean.includes('texture') || clean.includes('impasto')) return 'texture';
      if (clean.includes('abstract')) return 'abstract';
      return clean;
    }

    let currentActiveKey = null;

    // 3. Strict Show/Hide Logic:
    // When a category is active, ONLY its matching corner image(s) fade in (opacity: 1).
    // As soon as the user scrolls past (or out of focus), image(s) fade back out to opacity: 0.
    function setActiveCategory(catKeyOrItem) {
      let targetKey = null;
      if (typeof catKeyOrItem === 'string') {
        targetKey = normalizeCategory(catKeyOrItem);
      } else if (catKeyOrItem && catKeyOrItem.dataset) {
        targetKey = normalizeCategory(catKeyOrItem.dataset.category || catKeyOrItem.textContent);
      }

      if (targetKey === currentActiveKey) return;
      currentActiveKey = targetKey;

      // Update text in-focus highlights
      items.forEach(item => {
        const itemCat = normalizeCategory(item.dataset.category || item.textContent);
        item.classList.toggle('is-in-focus', targetKey !== null && itemCat === targetKey);
      });

      if (!targetKey) {
        // No category in focus: all corner images fade to opacity: 0
        wraps.forEach(wrap => wrap.classList.remove('is-active'));
        return;
      }

      const activeSlots = CATEGORY_SLOTS[targetKey] || [0, 1];
      const paintings = CATEGORY_DATA[targetKey] || CATEGORY_DATA['abstract'];

      // On mobile: only activate 1 slot (first) to avoid overlap on narrow screens
      const maxSlots = isMobileWidth() ? 1 : activeSlots.length;
      const effectiveSlots = activeSlots.slice(0, maxSlots);

      wraps.forEach((wrap, wrapIdx) => {
        const slotPos = effectiveSlots.indexOf(wrapIdx);
        if (slotPos !== -1) {
          // Single product object lookup: src AND caption ALWAYS from the exact same item
          const painting = paintings[slotPos % paintings.length];
          const img = wrap.querySelector('img');
          const caption = wrap.querySelector('.editorial-polaroid__caption');
          const link = wrap.querySelector('.editorial-polaroid');

          if (img) {
            img.src = painting.img;
            img.alt = `${painting.title} by Nandita Albright`;
          }
          if (caption) {
            caption.textContent = `${painting.title} · ${painting.cat}`;
          }
          if (link) {
            link.href = `/gallery?category=${encodeURIComponent(painting.cat)}`;
          }

          // Fade in smoothly via CSS transition
          wrap.classList.add('is-active');
        } else {
          // All other wraps fade out to opacity: 0
          wrap.classList.remove('is-active');
        }
      });
    }

    // 4. Click & Hover Handlers on Category Links
    links.forEach(link => {
      // Direct click handler: guarantees immediate navigation without interference
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute('href');
        if (href) {
          window.location.href = href;
        }
      });

      // Hover: immediate preview & focus
      link.addEventListener('mouseenter', () => {
        const parentItem = link.closest('.editorial-cat-item');
        if (parentItem) {
          setActiveCategory(parentItem);
        }
      });
    });

    // Also support clicking anywhere on the item row
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const link = item.querySelector('.editorial-cat-link');
        if (link && e.target !== link) {
          e.preventDefault();
          const href = link.getAttribute('href');
          if (href) {
            window.location.href = href;
          }
        }
      });
    });

    // 5. Touch-tap category activation (mobile: hover is dead on touch screens)
    if (isTouchDevice()) {
      let tapNavTimer = null;
      items.forEach(item => {
        item.addEventListener('touchend', (e) => {
          // Don't interfere with the link's own tap navigation
          const link = item.querySelector('.editorial-cat-link');
          const catKey = normalizeCategory(item.dataset.category || item.textContent);

          if (catKey === currentActiveKey) {
            // Second tap: navigate immediately
            clearTimeout(tapNavTimer);
            if (link) window.location.href = link.getAttribute('href');
            return;
          }

          e.preventDefault();
          setActiveCategory(item);

          // Auto-navigate after a short preview window
          clearTimeout(tapNavTimer);
          tapNavTimer = setTimeout(() => {
            if (link) window.location.href = link.getAttribute('href');
          }, 1800);
        }, { passive: false });
      });
    }

    // 6. IntersectionObserver: Threshold driving middle focus band
    // On desktop: middle 40% band ("-30% 0px -30%")
    // On mobile:  wider 60% band ("-20% 0px -20%") because viewport height is much shorter
    if ('IntersectionObserver' in window) {
      const intersectingItems = new Set();
      let pendingRaf = null;

      // Re-evaluate on resize (landscape ↔ portrait)
      let focusObserver;

      function buildObserver() {
        if (focusObserver) focusObserver.disconnect();
        const mobile = isMobileWidth();
        // Mobile: shorter viewport → wider focus band so items activate reliably with touch flick
        const margin = mobile ? '-20% 0px -20% 0px' : '-30% 0px -30% 0px';

        focusObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              intersectingItems.add(entry.target);
            } else {
              intersectingItems.delete(entry.target);
            }
          });

          // Batch update to the next animation frame to eliminate layout jank
          if (!pendingRaf) {
            pendingRaf = requestAnimationFrame(() => {
              resolveActiveBandItem();
              pendingRaf = null;
            });
          }
        }, {
          rootMargin: margin,
          threshold: 0
        });

        items.forEach(item => focusObserver.observe(item));
      }

      function resolveActiveBandItem() {
        if (intersectingItems.size === 0) {
          setActiveCategory(null);
          return;
        }

        if (intersectingItems.size === 1) {
          const soleItem = intersectingItems.values().next().value;
          setActiveCategory(soleItem);
          return;
        }

        // Multiple items in band: select the one closest to vertical center
        const viewportCenterY = window.innerHeight / 2;
        let closestItem = null;
        let minDist = Infinity;

        intersectingItems.forEach(item => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.top + rect.height / 2;
          const dist = Math.abs(itemCenter - viewportCenterY);
          if (dist < minDist) {
            minDist = dist;
            closestItem = item;
          }
        });

        if (closestItem) {
          setActiveCategory(closestItem);
        }
      }

      buildObserver();

      // Rebuild observer on resize (handles orientation change)
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          intersectingItems.clear();
          buildObserver();
        }, 200);
      }, { passive: true });

      // Observe the whole section: if completely out of view, ensure all images disappear
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            intersectingItems.clear();
            setActiveCategory(null);
          }
        });
      }, {
        threshold: 0
      });
      sectionObserver.observe(section);

    } else {
      // Fallback
      setActiveCategory(items[0]);
    }
  }

  // ── Init all ──
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initParallax();
    initCounters();
    initSignature();
    initRipple();
    initAccordions();
    initStickyCart();
    initCardTilt();
    initTouchQuickView();
    initDragScroll();
    initBrandMark();
    initEditorialParallax();
  });

  // Expose binders for dynamic content
  window.NanditaArts = window.NanditaArts || {};
  window.NanditaArts.initCardTilt = initCardTilt;
  window.NanditaArts.initDragScroll = initDragScroll;
})();
