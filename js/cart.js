/* ============================================
   CART PAGE LOGIC — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  let cart = JSON.parse(localStorage.getItem('na_cart') || '[]');
  let promoCode = localStorage.getItem('na_promo') || '';

  function saveCart() {
    localStorage.setItem('na_cart', JSON.stringify(cart));
    updateNavBadge();
  }

  function updateNavBadge() {
    const badges = document.querySelectorAll('.nav__cart-badge');
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    badges.forEach(b => {
      b.textContent = total;
      b.classList.toggle('is-visible', total > 0);
    });
  }

  function renderCartPage() {
    const wrap = document.getElementById('cartContentWrap');
    if (!wrap) return;

    if (cart.length === 0) {
      wrap.innerHTML = `
        <div class="empty-cart-view">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto var(--space-4);color:var(--color-gold);opacity:0.8;">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <h2 style="font-family:var(--font-display);font-size:var(--fs-2xl);color:var(--color-off-white);margin-bottom:var(--space-2);">Your art cart is currently empty</h2>
          <p style="color:var(--color-beige-dim);max-width:440px;margin:0 auto var(--space-6);font-size:var(--fs-sm);line-height:var(--lh-relaxed);">
            Browse our original oil & acrylic paintings or museum-grade prints to find a piece that speaks to your sanctuary.
          </p>
          <a href="/gallery" class="btn btn--primary btn--lg">Explore the Collection</a>
        </div>
      `;
      return;
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    let discount = 0;
    if (promoCode.toUpperCase() === 'TAKE10') {
      discount = subtotal * 0.10;
    }

    const eligibleForFreeShipping = (subtotal - discount) >= 200;
    const shipping = eligibleForFreeShipping ? 0 : 25;
    const tax = Math.round(((subtotal - discount) * 0.065) * 100) / 100;
    const grandTotal = Math.round(((subtotal - discount) + shipping + tax) * 100) / 100;

    wrap.innerHTML = `
      <div class="cart-grid">
        <div class="cart-table-card">
          <div class="cart-table-header">
            <div>Artwork Details</div>
            <div>Price</div>
            <div>Quantity</div>
            <div style="text-align:right;">Subtotal</div>
          </div>
          <div>
            ${cart.map(item => `
              <div class="cart-row" data-id="${item.id}">
                <div class="cart-item-info">
                  <div class="cart-item-thumb">
                    <img src="${item.img}" alt="${item.title}" loading="lazy">
                  </div>
                  <div>
                    <a href="/product?id=${item.id}" style="font-family:var(--font-display);font-size:var(--fs-md);color:var(--color-off-white);text-decoration:none;">${item.title}</a>
                    <div style="font-size:var(--fs-xs);color:var(--color-beige-dim);margin-top:2px;">${item.dims} · ${item.medium}</div>
                    <button class="cart-remove-btn" data-id="${item.id}" style="background:none;border:none;color:var(--color-gold);font-size:12px;cursor:pointer;padding:0;margin-top:var(--space-2);text-decoration:underline;">Remove Artwork</button>
                  </div>
                </div>
                <div style="font-size:var(--fs-sm);color:var(--color-beige);">$${item.price.toLocaleString()}</div>
                <div>
                  <div class="cart-qty-ctrl">
                    <button class="cart-qty-btn cart-qty-minus" data-id="${item.id}">−</button>
                    <span class="cart-qty-val">${item.qty}</span>
                    <button class="cart-qty-btn cart-qty-plus" data-id="${item.id}">+</button>
                  </div>
                </div>
                <div style="text-align:right;font-family:var(--font-display);font-size:var(--fs-lg);color:var(--color-off-white);">
                  $${(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cart-summary-card">
          <h2 style="font-family:var(--font-display);font-size:var(--fs-xl);color:var(--color-off-white);margin-bottom:var(--space-6);">Order Summary</h2>
          
          <div class="summary-line">
            <span>Paintings Subtotal</span>
            <span>$${subtotal.toLocaleString()}</span>
          </div>

          ${discount > 0 ? `
            <div class="summary-line" style="color:var(--color-gold);">
              <span>Studio Privilege (TAKE10 - 10%)</span>
              <span>−$${discount.toLocaleString()}</span>
            </div>
          ` : ''}

          <div class="summary-line">
            <span>Studio Insured Shipping</span>
            <span>${shipping === 0 ? '<span style="color:var(--color-gold)">FREE</span>' : '$25.00'}</span>
          </div>

          <div class="summary-line">
            <span>Estimated State Tax (6.5%)</span>
            <span>$${tax.toFixed(2)}</span>
          </div>

          <div class="summary-line summary-line--total">
            <span>Estimated Total</span>
            <span style="color:var(--color-gold);">$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div class="promo-form">
            <input type="text" class="promo-input" id="promoInput" placeholder="Promo code (e.g. TAKE10)" value="${promoCode}">
            <button class="btn btn--outline" id="applyPromoBtn" style="padding:var(--space-2) var(--space-4);font-size:var(--fs-xs);">Apply</button>
          </div>

          <div style="margin-top:var(--space-6);">
            <a href="/checkout" class="btn btn--primary btn--wide btn--lg" style="text-align:center;">Proceed to Studio Checkout</a>
            <a href="/gallery" style="display:block;text-align:center;margin-top:var(--space-4);color:var(--color-beige-dim);font-size:var(--fs-xs);text-decoration:none;">← Continue Browsing Gallery</a>
          </div>

          <div style="margin-top:var(--space-6);padding-top:var(--space-5);border-top:var(--border-subtle);font-size:var(--fs-xs);color:var(--color-beige-dim);line-height:var(--lh-relaxed);">
            <div>✓ Hand-packed in custom protective wooden art crating</div>
            <div>✓ Includes Certificate of Authenticity signed by Nandita</div>
            <div>✓ Fully insured transit & signature on delivery</div>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    wrap.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCartPage();
      });
    });

    wrap.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item) {
          if (item.stock && item.qty >= item.stock) {
            window.NanditaArts?.showToast?.(`Only ${item.stock} in stock.`);
            return;
          }
          item.qty++;
          saveCart();
          renderCartPage();
        }
      });
    });

    wrap.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item) {
          item.qty--;
          if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
          }
          saveCart();
          renderCartPage();
        }
      });
    });

    document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
      const code = document.getElementById('promoInput')?.value.trim();
      if (code.toUpperCase() === 'TAKE10') {
        promoCode = 'TAKE10';
        localStorage.setItem('na_promo', promoCode);
        window.NanditaArts?.showToast?.('Promo code TAKE10 applied: 10% off!');
      } else if (code) {
        window.NanditaArts?.showToast?.('Invalid promo code.');
      } else {
        promoCode = '';
        localStorage.removeItem('na_promo');
      }
      renderCartPage();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateNavBadge();
    renderCartPage();
  });
})();
