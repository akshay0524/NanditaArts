/* ============================================
   DRAG-TO-SCROLL CAROUSEL — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  class MomentumCarousel {
    constructor(el) {
      this.wrap = el;
      this.track = el.querySelector('.carousel-track');
      if (!this.track) return;

      this.items = Array.from(this.track.children);
      this.isDragging = false;
      this.startX = 0;
      this.currentX = 0;
      this.velocity = 0;
      this.lastX = 0;
      this.lastTime = 0;
      this.rafId = null;
      this.offset = 0;
      this.minOffset = 0;
      this.maxOffset = 0;

      this.prevBtn = el.closest('.carousel-section')?.querySelector('.carousel-btn--prev');
      this.nextBtn = el.closest('.carousel-section')?.querySelector('.carousel-btn--next');

      this.init();
    }

    init() {
      this.calcBounds();
      this.bindEvents();
      window.addEventListener('resize', () => this.calcBounds(), { passive: true });
    }

    calcBounds() {
      const trackW = this.track.scrollWidth;
      const wrapW = this.wrap.clientWidth;
      this.maxOffset = 0;
      this.minOffset = -(trackW - wrapW);
      this.offset = Math.max(this.minOffset, Math.min(this.maxOffset, this.offset));
      this.updateTransform(false);
      this.updateBtns();
    }

    bindEvents() {
      // Pointer (works for mouse + touch)
      this.wrap.addEventListener('pointerdown', this.onDown.bind(this));
      document.addEventListener('pointermove', this.onMove.bind(this));
      document.addEventListener('pointerup', this.onUp.bind(this));
      document.addEventListener('pointercancel', this.onUp.bind(this));

      // Buttons
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.step(-1));
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.step(1));

      // Prevent native scroll on the wrap
      this.wrap.addEventListener('touchstart', e => {
        if (this.isDragging) e.preventDefault();
      }, { passive: false });
    }

    onDown(e) {
      cancelAnimationFrame(this.rafId);
      this.isDragging = true;
      this.startX = e.clientX;
      this.lastX = e.clientX;
      this.lastTime = performance.now();
      this.velocity = 0;
      this.track.classList.add('is-dragging');
      this.wrap.setPointerCapture(e.pointerId);
    }

    onMove(e) {
      if (!this.isDragging) return;
      const now = performance.now();
      const dt = now - this.lastTime;
      if (dt > 0) {
        this.velocity = (e.clientX - this.lastX) / dt;
      }
      this.lastX = e.clientX;
      this.lastTime = now;

      const delta = e.clientX - this.startX;
      this.startX = e.clientX;

      this.offset += delta;
      // Rubber-band beyond bounds
      if (this.offset > this.maxOffset) {
        this.offset = this.maxOffset + (this.offset - this.maxOffset) * 0.3;
      }
      if (this.offset < this.minOffset) {
        this.offset = this.minOffset + (this.offset - this.minOffset) * 0.3;
      }
      this.updateTransform(false);
    }

    onUp() {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.track.classList.remove('is-dragging');

      // Apply momentum
      const FRICTION = 0.94;
      const VELOCITY_SCALE = 16;

      const tick = () => {
        this.velocity *= FRICTION;
        this.offset += this.velocity * VELOCITY_SCALE;

        // Snap back to bounds with spring
        if (this.offset > this.maxOffset) {
          this.offset += (this.maxOffset - this.offset) * 0.15;
        }
        if (this.offset < this.minOffset) {
          this.offset += (this.minOffset - this.offset) * 0.15;
        }

        this.updateTransform(false);
        this.updateBtns();

        if (Math.abs(this.velocity) > 0.01 || this.offset > this.maxOffset || this.offset < this.minOffset) {
          this.rafId = requestAnimationFrame(tick);
        }
      };

      this.rafId = requestAnimationFrame(tick);
    }

    step(dir) {
      const itemW = (this.items[0]?.offsetWidth || 300) + 16; // gap
      this.offset = Math.max(this.minOffset, Math.min(this.maxOffset, this.offset - dir * itemW * 2));
      this.updateTransform(true);
      this.updateBtns();
    }

    updateTransform(animated) {
      this.track.style.transition = animated
        ? `transform 500ms cubic-bezier(0.22, 1, 0.36, 1)`
        : 'none';
      this.track.style.transform = `translateX(${this.offset}px) translateZ(0)`;
    }

    updateBtns() {
      if (this.prevBtn) this.prevBtn.disabled = this.offset >= this.maxOffset;
      if (this.nextBtn) this.nextBtn.disabled = this.offset <= this.minOffset;
    }
  }

  // Auto-scrolling testimonials carousel
  class AutoCarousel {
    constructor(el) {
      this.track = el;
      if (!this.track) return;
      this.isPaused = false;
      this.offset = 0;
      this.speed = 0.4; // px per frame
      this.rafId = null;
      this.cloned = false;

      this.init();
    }

    init() {
      // Clone items for seamless loop
      const items = Array.from(this.track.children);
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        this.track.appendChild(clone);
      });
      this.cloned = true;
      this.totalW = this.track.scrollWidth / 2;

      this.track.parentElement?.addEventListener('mouseenter', () => { this.isPaused = true; });
      this.track.parentElement?.addEventListener('mouseleave', () => { this.isPaused = false; });

      this.animate();
    }

    animate() {
      if (!this.isPaused) {
        this.offset += this.speed;
        if (this.offset >= this.totalW) this.offset = 0;
        this.track.style.transform = `translateX(${-this.offset}px) translateZ(0)`;
      }
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Drag carousels
    document.querySelectorAll('.carousel-track-wrap').forEach(wrap => {
      new MomentumCarousel(wrap);
    });

    // Auto-scroll testimonials
    const autoTrack = document.querySelector('.testimonials-auto-track');
    if (autoTrack) new AutoCarousel(autoTrack);
  });
})();
