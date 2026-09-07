/* ============================================
   CHECKOUT LOGIC & PAYMENT GATEWAY — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  // ── Static / GitHub Pages detection ──
  // When running on GitHub Pages there is no Express server, so all /api/* calls
  // will fail. We detect this by hostname and switch to a graceful demo mode.
  const IS_STATIC = (() => {
    const h = window.location.hostname;
    return h !== 'localhost' && h !== '127.0.0.1' && !h.startsWith('192.168');
  })();

  // ── Inject demo-mode banner (static only) ──
  function showStaticDemoBanner() {
    if (document.getElementById('staticDemoBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'staticDemoBanner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
      'background:linear-gradient(90deg,#1a1400,#2a1f00)',
      'border-bottom:1px solid rgba(201,168,76,0.4)',
      'padding:10px 20px',
      'display:flex', 'align-items:center', 'gap:12px',
      'font-size:13px', 'color:#e8d5a3', 'font-family:system-ui,sans-serif'
    ].join(';');
    banner.innerHTML = [
      '<span style="font-size:16px;">&#127774;</span>',
      '<span>',
        '<strong style="color:#c9a84c;">Portfolio Demo Mode</strong>',
        ' — Checkout and authentication require the Node.js backend.',
        ' <a href="https://github.com/akshay0524/NanditaArts" target="_blank" rel="noopener"',
        '    style="color:#c9a84c;text-decoration:underline;">View source on GitHub</a>',
        ' &nbsp;|&nbsp; Submitting simulates a successful order.',
      '</span>',
      '<button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#c9a84c;font-size:18px;cursor:pointer;" aria-label="Dismiss">&times;</button>'
    ].join('');
    document.body.prepend(banner);
    // Push body content below the banner
    document.body.style.paddingTop = (parseInt(document.body.style.paddingTop) || 0) + banner.offsetHeight + 'px';
  }

  let cart = JSON.parse(localStorage.getItem('na_cart') || '[]');
  const promoCode = localStorage.getItem('na_promo') || '';
  let selectedShippingMethod = 'standard';
  let activeGateway = 'stripe';

  // ── Redirect if empty cart ──
  if (!cart || cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // ── DOM References ──
  const form = document.getElementById('checkoutForm');
  const alertBanner = document.getElementById('checkoutAlert');
  const submitBtn = document.getElementById('submitOrderBtn');
  const btnPayTotal = document.getElementById('btnPayTotal');

  // Summary fields
  const miniItemsEl = document.getElementById('checkoutMiniItems');
  const sumSubtotalEl = document.getElementById('sumSubtotal');
  const sumDiscountRow = document.getElementById('sumDiscountRow');
  const sumDiscountEl = document.getElementById('sumDiscount');
  const sumShippingEl = document.getElementById('sumShipping');
  const sumTaxEl = document.getElementById('sumTax');
  const sumGrandTotalEl = document.getElementById('sumGrandTotal');
  const standardShipCostLabel = document.getElementById('standardShipCostLabel');

  // Shipping option elements
  const optStandard = document.getElementById('optStandard');
  const optExpress = document.getElementById('optExpress');

  // ── Fetch Gateway Config (skipped in static mode) ──
  async function initPaymentConfig() {
    if (IS_STATIC) return; // No server in static/GitHub Pages deployment
    try {
      const res = await fetch('/api/config/payment');
      if (res.ok) {
        const config = await res.json();
        if (config.gateway) {
          activeGateway = config.gateway;
          switchGatewayTab(activeGateway);
        }
      }
    } catch (err) {
      console.warn('Could not fetch payment config:', err);
    }
  }

  // ── Render Mini Items & Calculate Totals ──
  function updateOrderCalculations() {
    if (!cart.length) return;

    // Render items list
    if (miniItemsEl) {
      miniItemsEl.innerHTML = cart.map(item => `
        <div class="checkout-item-mini">
          <img src="${item.img}" alt="${item.title}" loading="lazy">
          <div style="flex:1;">
            <div style="font-family:var(--font-display);font-size:var(--fs-sm);color:var(--color-off-white);">${item.title}</div>
            <div style="font-size:var(--fs-xs);color:var(--color-beige-dim);">${item.dims} · Qty: ${item.qty}</div>
          </div>
          <div style="font-size:var(--fs-sm);color:var(--color-off-white);font-weight:500;">
            $${(item.price * item.qty).toLocaleString()}
          </div>
        </div>
      `).join('');
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    let discount = 0;
    if (promoCode.toUpperCase() === 'TAKE10') {
      discount = subtotal * 0.10;
    }

    const discountedSubtotal = subtotal - discount;
    const isFreeStandard = discountedSubtotal >= 200;

    if (standardShipCostLabel) {
      standardShipCostLabel.innerHTML = isFreeStandard
        ? '<span style="color:var(--color-gold);">FREE</span>'
        : '$25.00';
    }

    const shipping = selectedShippingMethod === 'express' ? 65 : (isFreeStandard ? 0 : 25);
    const tax = Math.round((discountedSubtotal * 0.065) * 100) / 100;
    const grandTotal = Math.round((discountedSubtotal + shipping + tax) * 100) / 100;

    if (sumSubtotalEl) sumSubtotalEl.textContent = `$${subtotal.toLocaleString()}`;
    if (sumDiscountRow) {
      if (discount > 0) {
        sumDiscountRow.style.display = 'flex';
        sumDiscountEl.textContent = `−$${discount.toLocaleString()}`;
      } else {
        sumDiscountRow.style.display = 'none';
      }
    }
    if (sumShippingEl) sumShippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (sumTaxEl) sumTaxEl.textContent = `$${tax.toFixed(2)}`;
    if (sumGrandTotalEl) sumGrandTotalEl.textContent = `$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (btnPayTotal) btnPayTotal.textContent = `$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return { subtotal, discount, shipping, tax, grandTotal };
  }

  // ── Gateway Switcher ──
  function switchGatewayTab(gw) {
    activeGateway = gw;
    document.querySelectorAll('.gateway-pill').forEach(pill => {
      pill.classList.toggle('is-active', pill.dataset.gw === gw);
    });

    const stripePanel = document.getElementById('stripePaymentPanel');
    const razorpayPanel = document.getElementById('razorpayPaymentPanel');

    if (gw === 'stripe') {
      if (stripePanel) stripePanel.style.display = 'block';
      if (razorpayPanel) razorpayPanel.style.display = 'none';
    } else {
      if (stripePanel) stripePanel.style.display = 'none';
      if (razorpayPanel) razorpayPanel.style.display = 'block';
    }
  }

  // ── Validation Helpers with Helpful Messages ──
  function showFieldError(fieldId, errorId, show) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errorId);
    if (field) field.classList.toggle('is-invalid', show);
    if (err) err.classList.toggle('is-visible', show);
  }

  function validateCheckoutForm() {
    let isValid = true;

    // Name
    const name = document.getElementById('custName')?.value.trim();
    if (!name || name.length < 2) {
      showFieldError('custName', 'errCustName', true);
      isValid = false;
    } else {
      showFieldError('custName', 'errCustName', false);
    }

    // Email
    const email = document.getElementById('custEmail')?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showFieldError('custEmail', 'errCustEmail', true);
      isValid = false;
    } else {
      showFieldError('custEmail', 'errCustEmail', false);
    }

    // Phone
    const phone = document.getElementById('custPhone')?.value.trim();
    if (!phone || phone.length < 7) {
      showFieldError('custPhone', 'errCustPhone', true);
      isValid = false;
    } else {
      showFieldError('custPhone', 'errCustPhone', false);
    }

    // Address
    const address = document.getElementById('shipAddress')?.value.trim();
    if (!address) {
      showFieldError('shipAddress', 'errShipAddress', true);
      isValid = false;
    } else {
      showFieldError('shipAddress', 'errShipAddress', false);
    }

    // City
    const city = document.getElementById('shipCity')?.value.trim();
    if (!city) {
      showFieldError('shipCity', 'errShipCity', true);
      isValid = false;
    } else {
      showFieldError('shipCity', 'errShipCity', false);
    }

    // State
    const state = document.getElementById('shipState')?.value.trim();
    if (!state) {
      showFieldError('shipState', 'errShipState', true);
      isValid = false;
    } else {
      showFieldError('shipState', 'errShipState', false);
    }

    // Zip
    const zip = document.getElementById('shipZip')?.value.trim();
    if (!zip || zip.length < 3) {
      showFieldError('shipZip', 'errShipZip', true);
      isValid = false;
    } else {
      showFieldError('shipZip', 'errShipZip', false);
    }

    // Payment validation (if Stripe active)
    if (activeGateway === 'stripe') {
      const cardNum = document.getElementById('cardNum')?.value.replace(/\s+/g, '');
      if (!cardNum || cardNum.length < 15) {
        showFieldError('cardNum', 'errCardNum', true);
        isValid = false;
      } else {
        showFieldError('cardNum', 'errCardNum', false);
      }

      const cardExp = document.getElementById('cardExp')?.value.trim();
      if (!cardExp || !cardExp.includes('/') || cardExp.length < 5) {
        showFieldError('cardExp', 'errCardExp', true);
        isValid = false;
      } else {
        showFieldError('cardExp', 'errCardExp', false);
      }

      const cardCvv = document.getElementById('cardCvv')?.value.trim();
      if (!cardCvv || cardCvv.length < 3) {
        showFieldError('cardCvv', 'errCardCvv', true);
        isValid = false;
      } else {
        showFieldError('cardCvv', 'errCardCvv', false);
      }
    }

    return isValid;
  }

  // ── Card Number Formatting ──
  const cardNumInput = document.getElementById('cardNum');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = val;
    });
  }

  const cardExpInput = document.getElementById('cardExp');
  if (cardExpInput) {
    cardExpInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2);
      }
      e.target.value = val;
    });
  }

  // ── Shipping Method Option Clicks ──
  optStandard?.addEventListener('click', () => {
    selectedShippingMethod = 'standard';
    optStandard.classList.add('is-selected');
    optExpress?.classList.remove('is-selected');
    optStandard.querySelector('input').checked = true;
    updateOrderCalculations();
  });

  optExpress?.addEventListener('click', () => {
    selectedShippingMethod = 'express';
    optExpress.classList.add('is-selected');
    optStandard?.classList.remove('is-selected');
    optExpress.querySelector('input').checked = true;
    updateOrderCalculations();
  });

  // Gateway Picker clicks
  document.querySelectorAll('.gateway-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      switchGatewayTab(pill.dataset.gw);
    });
  });

  // ── Handle Checkout Submission ──
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertBanner) alertBanner.classList.remove('is-visible');

    if (!validateCheckoutForm()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // Disable button during processing
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Securing Studio Order…';
    }

    const customer = {
      name: document.getElementById('custName').value.trim(),
      email: document.getElementById('custEmail').value.trim(),
      phone: document.getElementById('custPhone').value.trim()
    };

    const shippingAddress = {
      address: document.getElementById('shipAddress').value.trim(),
      apt: document.getElementById('shipApt')?.value.trim() || '',
      city: document.getElementById('shipCity').value.trim(),
      state: document.getElementById('shipState').value.trim(),
      zip: document.getElementById('shipZip').value.trim(),
      country: document.getElementById('shipCountry').value
    };

    const cardNum = document.getElementById('cardNum')?.value.replace(/\s+/g, '') || '';
    const paymentDetails = {
      gateway: activeGateway,
      cardBrand: cardNum.startsWith('4') ? 'Visa' : (cardNum.startsWith('5') ? 'Mastercard' : 'Studio Card'),
      cardLast4: cardNum.slice(-4) || '4242',
      transactionId: 'txn_' + Date.now()
    };

    // ── Static / Demo Mode: simulate a successful order locally ──
    if (IS_STATIC) {
      await new Promise(r => setTimeout(r, 1200)); // simulate processing delay
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      let discount = promoCode.toUpperCase() === 'TAKE10' ? subtotal * 0.10 : 0;
      const discountedSubtotal = subtotal - discount;
      const shipping = selectedShippingMethod === 'express' ? 65 : (discountedSubtotal >= 200 ? 0 : 25);
      const tax = Math.round(discountedSubtotal * 0.065 * 100) / 100;
      const total = Math.round((discountedSubtotal + shipping + tax) * 100) / 100;

      const demoOrder = {
        id: 'DEMO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        createdAt: new Date().toISOString(),
        customer,
        shippingAddress,
        shippingOption: selectedShippingMethod,
        items: cart,
        subtotal, discount, shipping, tax, total,
        payment: { ...paymentDetails, status: 'paid (demo)' },
        status: 'Processing (Demo)',
        _isDemo: true
      };

      localStorage.removeItem('na_cart');
      localStorage.removeItem('na_promo');
      localStorage.setItem('na_last_order', JSON.stringify(demoOrder));
      window.location.href = `order-confirmation.html?orderId=${demoOrder.id}`;
      return;
    }

    // ── Live Mode: real API flow ──
    try {
      // 1. Create Payment Intent & Verify stock on server
      const paymentRes = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          shippingOption: selectedShippingMethod,
          promoCode,
          shippingAddress
        })
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentData.error || 'Payment initialization failed.');
      }

      // 2. Finalize & Save Order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          shippingAddress,
          items: cart,
          shippingOption: selectedShippingMethod,
          promoCode,
          paymentDetails
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to place order.');
      }

      // Clear cart
      localStorage.removeItem('na_cart');
      localStorage.removeItem('na_promo');

      // Save last completed order to localStorage for confirmation page retrieval
      localStorage.setItem('na_last_order', JSON.stringify(orderData.order));

      // Redirect to Order Confirmation
      window.location.href = `order-confirmation.html?orderId=${orderData.orderId}`;
    } catch (err) {
      console.error('Checkout error:', err);
      if (alertBanner) {
        alertBanner.textContent = `Payment Notice: ${err.message}. Please check your payment details or try another card.`;
        alertBanner.classList.add('is-visible');
        window.scrollTo({ top: 50, behavior: 'smooth' });
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Place Studio Order · <span id="btnPayTotal">$0.00</span>`;
        updateOrderCalculations();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (IS_STATIC) showStaticDemoBanner();
    initPaymentConfig();
    updateOrderCalculations();
  });
})();
