/* ============================================
   GALLERY & REAL-TIME MULTI-FILTERING — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  const CATEGORIES = [
    'All',
    'Abstract',
    'Animal Art',
    'Cityscape',
    'Figure',
    'Flower',
    'Landscape',
    'Modern',
    'Music',
    'Oil',
    'Seascape',
    'Texture',
    'Jackson Pollock Style',
    'Giclée Prints'
  ];

  // Default fallback items in case API is loading or offline
  const FALLBACK_PRODUCTS = [
    { id: 1, title: 'Crimson Reverie', category: 'Abstract', price: 1200, dims: '24×36"', medium: 'Acrylic on Canvas', img: 'assets/images/p1.jpg', badge: 'Original', stock: 1, description: 'Bold sweeps of deep cadmium red and luminous raw gold, layered with intuitive palette knife strokes.' },
    { id: 2, title: 'Urban Nocturne', category: 'Cityscape', price: 950, dims: '18×24"', medium: 'Oil on Canvas', img: 'assets/images/p2.jpg', badge: null, stock: 1, description: 'Reflective twilight rain over city pavements and amber street lamps rendered in textured oil glazes.' },
    { id: 3, title: 'Bloom & Scatter', category: 'Flower', price: 780, dims: '20×20"', medium: 'Acrylic on Canvas', img: 'assets/images/p3.jpg', badge: null, stock: 2, description: 'Expressive floral study in organic blush, terracotta, and soft olive tones.' },
    { id: 4, title: 'Oceanic Drift', category: 'Seascape', price: 1100, dims: '30×24"', medium: 'Oil on Canvas', img: 'assets/images/p4.jpg', badge: 'New', stock: 1, description: 'Rich cerulean and seafoam layers crashing against weathered coastal rocks.' },
    { id: 5, title: 'Jazz Composition', category: 'Music', price: 860, dims: '24×30"', medium: 'Acrylic on Canvas', img: 'assets/images/p5.jpg', badge: null, stock: 1, description: 'Rhythmic lines and improvisational brushwork inspired by late-night jazz solos.' },
    { id: 6, title: 'Golden Meadow', category: 'Landscape', price: 1050, dims: '36×24"', medium: 'Oil on Canvas', img: 'assets/images/p6.jpg', badge: null, stock: 1, description: 'Sunlit rolling fields bathed in late afternoon golden hour light.' },
    { id: 7, title: 'Textured Silence', category: 'Texture', price: 690, dims: '16×20"', medium: 'Mixed Media', img: 'assets/images/p7.jpg', badge: null, stock: 3, description: 'Heavy impasto plaster and matte earth pigments creating a tactile sculptural relief.' },
    { id: 8, title: 'Wild Spirit', category: 'Animal Art', price: 920, dims: '20×24"', medium: 'Acrylic on Canvas', img: 'assets/images/p8.jpg', badge: null, stock: 1, description: 'Dynamic equine silhouette bursting through subtle earth pigments and gold leaf dust.' },
    { id: 9, title: 'Pollock Dreams', category: 'Jackson Pollock Style', price: 1350, dims: '36×48"', medium: 'Enamel & Acrylic', img: 'assets/images/p1.jpg', badge: 'Featured', stock: 1, description: 'Action painting featuring intricate dripped and poured pigment webs.' },
    { id: 10, title: 'Figure in Blue', category: 'Figure', price: 1250, dims: '24×36"', medium: 'Oil on Canvas', img: 'assets/images/p2.jpg', badge: null, stock: 1, description: 'Figurative contemplation draped in ultramarine and warm sienna.' },
    { id: 11, title: 'Modern Cascade', category: 'Modern', price: 840, dims: '20×30"', medium: 'Acrylic on Canvas', img: 'assets/images/p3.jpg', badge: null, stock: 2, description: 'Geometric balance meets fluid spontaneity in warm ochre and muted slate.' },
    { id: 12, title: 'Giclée Reverie I', category: 'Giclée Prints', price: 185, dims: '12×18"', medium: 'Archival Giclée Print', img: 'assets/images/p4.jpg', badge: 'Limited Edition', stock: 15, description: 'Museum-grade archival pigment print on 310gsm cotton rag. Signed and numbered.' },
    { id: 13, title: 'Coastal Morning Mist', category: 'Oil', price: 1150, dims: '28×22"', medium: 'Oil on Canvas', img: 'assets/images/p6.jpg', badge: 'Original', stock: 1, description: 'Atmospheric morning mist over coastal headlands rendered in delicate oil glazes.' }
  ];

  let allProducts = [...FALLBACK_PRODUCTS];
  let filterState = {
    category: 'All',
    price: 'all',
    size: 'all',
    sort: 'new',
    search: ''
  };

  let cart = JSON.parse(localStorage.getItem('na_cart') || '[]');

  // ── Fetch Fresh Paintings from Server ──
  async function fetchPaintings() {
    try {
      const res = await fetch('/api/paintings');
      if (res.ok) {
        const data = await res.json();
        if (data.paintings && data.paintings.length) {
          allProducts = data.paintings;
        }
      }
    } catch (err) {
      console.warn('Using local paintings cache:', err);
    }
  }

  // ── Cart Functions ──
  function saveCart() {
    localStorage.setItem('na_cart', JSON.stringify(cart));
  }

  function addToCart(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        window.NanditaArts?.showToast?.(`Only ${product.stock} available in studio.`);
        return;
      }
      existing.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartBadge();
    renderCart();
    window.NanditaArts?.showToast?.(`"${product.title}" added to your selection.`);
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.nav__cart-badge');
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    badges.forEach(badge => {
      badge.textContent = total;
      badge.classList.toggle('is-visible', total > 0);
    });
  }

  function renderCart() {
    const body = document.querySelector('.cart-drawer__body');
    const subtotalEl = document.querySelector('.cart-drawer__subtotal-value');
    if (!body) return;

    if (cart.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding: var(--space-16) var(--space-4); color: var(--color-beige-dim);">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto var(--space-3);opacity:0.6;">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p style="font-family:var(--font-display);font-size:var(--fs-lg);color:var(--color-off-white);margin-bottom:var(--space-2);">Your art cart is empty</p>
          <p style="font-size:var(--fs-xs);">Browse the collection to select original artworks or limited giclée prints.</p>
        </div>`;
    } else {
      body.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item__image">
            <img src="${item.img}" alt="${item.title}" loading="lazy">
          </div>
          <div style="flex:1;">
            <div class="cart-item__title">${item.title}</div>
            <div class="cart-item__dims">${item.dims} · ${item.medium}</div>
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-top:var(--space-2);">
              <span style="font-size:var(--fs-xs);color:var(--color-beige-dim);">Qty: ${item.qty}</span>
              <button class="cart-item__remove" data-id="${item.id}" style="background:none;border:none;color:var(--color-gold);font-size:var(--fs-xs);cursor:pointer;text-decoration:underline;">Remove</button>
            </div>
          </div>
          <div class="cart-item__price">$${(item.price * item.qty).toLocaleString()}</div>
        </div>
      `).join('');

      body.querySelectorAll('.cart-item__remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
      });
    }

    if (subtotalEl) {
      const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      subtotalEl.textContent = '$' + total.toLocaleString();
    }
  }

  // ── URL Query State Sync ──
  function readParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('category')) filterState.category = params.get('category');
    else if (params.has('cat')) filterState.category = params.get('cat');

    if (params.has('price')) filterState.price = params.get('price');
    if (params.has('size')) filterState.size = params.get('size');
    if (params.has('sort')) filterState.sort = params.get('sort');
    if (params.has('q')) filterState.search = params.get('q');
  }

  function syncUrlWithState() {
    const params = new URLSearchParams();
    if (filterState.category && filterState.category !== 'All') params.set('category', filterState.category);
    if (filterState.price && filterState.price !== 'all') params.set('price', filterState.price);
    if (filterState.size && filterState.size !== 'all') params.set('size', filterState.size);
    if (filterState.sort && filterState.sort !== 'new') params.set('sort', filterState.sort);
    if (filterState.search) params.set('q', filterState.search);

    const qs = params.toString();
    const newUrl = window.location.pathname + (qs ? '?' + qs : '');
    if (window.location.search !== (qs ? '?' + qs : '')) {
      history.pushState(filterState, '', newUrl);
    }
  }

  // ── Filter Category Tabs ──
  function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => {
      const isActive = cat.toLowerCase() === filterState.category.toLowerCase();
      return `
        <button class="filter-pill${isActive ? ' is-active' : ''}" data-cat="${cat}" role="tab" aria-selected="${isActive}">
          ${cat}
        </button>`;
    }).join('');

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        filterState.category = pill.dataset.cat;
        syncUrlWithState();
        applyFilters();
        renderCategoryTabs();
      });
    });
  }

  // ── Filter Controls Sync & Active Chips ──
  function syncControlInputs() {
    const priceSel = document.getElementById('priceFilter');
    const sizeSel = document.getElementById('sizeFilter');
    const sortSel = document.getElementById('sortSelect');

    if (priceSel) priceSel.value = filterState.price || 'all';
    if (sizeSel) sizeSel.value = filterState.size || 'all';
    if (sortSel) sortSel.value = filterState.sort || 'new';

    renderActiveFilterChips();
  }

  function renderActiveFilterChips() {
    const row = document.getElementById('activeFiltersRow');
    if (!row) return;

    const chips = [];

    if (filterState.category && filterState.category !== 'All') {
      chips.push({
        label: `Category: ${filterState.category}`,
        onRemove: () => { filterState.category = 'All'; renderCategoryTabs(); }
      });
    }

    if (filterState.price && filterState.price !== 'all') {
      const priceLabels = {
        'under-500': 'Price: Under $500',
        '500-1000': 'Price: $500–$1,000',
        '1000-1500': 'Price: $1,000–$1,500',
        'over-1500': 'Price: $1,500+'
      };
      chips.push({
        label: priceLabels[filterState.price] || `Price: ${filterState.price}`,
        onRemove: () => {
          filterState.price = 'all';
          const el = document.getElementById('priceFilter');
          if (el) el.value = 'all';
        }
      });
    }

    if (filterState.size && filterState.size !== 'all') {
      const sizeLabels = {
        'small': 'Size: Small (< 20")',
        'medium': 'Size: Medium (20"–30")',
        'large': 'Size: Large (> 30")'
      };
      chips.push({
        label: sizeLabels[filterState.size] || `Size: ${filterState.size}`,
        onRemove: () => {
          filterState.size = 'all';
          const el = document.getElementById('sizeFilter');
          if (el) el.value = 'all';
        }
      });
    }

    if (filterState.search) {
      chips.push({
        label: `Search: "${filterState.search}"`,
        onRemove: () => {
          filterState.search = '';
          const inp = document.getElementById('gallerySearchInput');
          if (inp) inp.value = '';
        }
      });
    }

    if (chips.length === 0) {
      row.innerHTML = '';
      return;
    }

    let html = chips.map((chip, idx) => `
      <span class="filter-tag">
        ${chip.label}
        <button type="button" data-chip-idx="${idx}" aria-label="Remove filter">✕</button>
      </span>
    `).join('');

    html += `<button type="button" class="clear-all-btn" id="clearAllFiltersBtn">Clear all filters</button>`;
    row.innerHTML = html;

    row.querySelectorAll('button[data-chip-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.chipIdx);
        if (chips[idx]) chips[idx].onRemove();
        syncUrlWithState();
        applyFilters();
      });
    });

    const clearAllBtn = document.getElementById('clearAllFiltersBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllFilters);
    }
  }

  function clearAllFilters() {
    filterState = {
      category: 'All',
      price: 'all',
      size: 'all',
      sort: 'new',
      search: ''
    };
    const priceSel = document.getElementById('priceFilter');
    const sizeSel = document.getElementById('sizeFilter');
    const sortSel = document.getElementById('sortSelect');
    const searchInp = document.getElementById('gallerySearchInput');

    if (priceSel) priceSel.value = 'all';
    if (sizeSel) sizeSel.value = 'all';
    if (sortSel) sortSel.value = 'new';
    if (searchInp) searchInp.value = '';

    syncUrlWithState();
    renderCategoryTabs();
    applyFilters();
  }

  // ── Card Creation & Reflow Animation ──
  function createCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card reveal is-visible';
    card.dataset.productId = product.id;
    card.innerHTML = `
      <div class="product-card__image-wrap">
        <img src="${product.img}" alt="${product.title} by Nandita Albright" loading="lazy" decoding="async">
        ${product.badge ? `<span class="product-card__badge">${product.badge}</span>` : ''}
        <button class="product-card__wishlist" aria-label="Add to wishlist" data-id="${product.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
        <div class="product-card__quick-view">
          <button class="product-card__quick-btn" data-id="${product.id}">Quick View</button>
        </div>
      </div>
      <div class="product-card__body">
        <div class="product-card__category">${product.category}</div>
        <h2 class="product-card__title" style="font-size:var(--fs-md);margin:0;font-weight:400;">${product.title}</h2>
        <div class="product-card__dims">${product.dims} · ${product.medium}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--space-2);">
          <div class="product-card__price">$${product.price.toLocaleString()}</div>
          <button class="btn btn--outline card-add-btn" data-id="${product.id}" style="padding:4px 12px;font-size:11px;letter-spacing:0.05em;">Add</button>
        </div>
      </div>
    `;

    // Wishlist
    card.querySelector('.product-card__wishlist').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = card.querySelector('.product-card__wishlist');
      btn.classList.toggle('is-active');
      window.NanditaArts?.showToast?.(btn.classList.contains('is-active') ? 'Saved to your favorites' : 'Removed from favorites');
    });

    // Quick view
    card.querySelector('.product-card__quick-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openQuickView(product);
    });

    // Add to cart button directly
    card.querySelector('.card-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product);
    });

    // Card click -> Product detail page
    card.addEventListener('click', () => {
      window.location.href = `/product?id=${product.id}`;
    });

    return card;
  }

  // ── Apply Real-Time Filtering & Smooth Reflow ──
  function applyFilters() {
    const grid = document.getElementById('productGrid');
    const countEl = document.getElementById('productCount');
    if (!grid) return;

    let filtered = allProducts.filter(p => {
      // Category
      if (filterState.category && filterState.category !== 'All') {
        if (p.category.toLowerCase() !== filterState.category.toLowerCase()) return false;
      }

      // Price
      if (filterState.price === 'under-500' && p.price >= 500) return false;
      if (filterState.price === '500-1000' && (p.price < 500 || p.price > 1000)) return false;
      if (filterState.price === '1000-1500' && (p.price < 1000 || p.price > 1500)) return false;
      if (filterState.price === 'over-1500' && p.price <= 1500) return false;

      // Size
      if (filterState.size && filterState.size !== 'all') {
        const match = p.dims.match(/(\d+)\s*×\s*(\d+)/);
        if (match) {
          const maxDim = Math.max(parseInt(match[1]), parseInt(match[2]));
          if (filterState.size === 'small' && maxDim > 20) return false;
          if (filterState.size === 'medium' && (maxDim <= 20 || maxDim > 30)) return false;
          if (filterState.size === 'large' && maxDim <= 30) return false;
        }
      }

      // Search keyword
      if (filterState.search) {
        const q = filterState.search.toLowerCase();
        const matches = p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.medium.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

    // Sort
    if (filterState.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (filterState.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (filterState.sort === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (filterState.sort === 'new') filtered.sort((a, b) => b.id - a.id);

    // Update counter
    if (countEl) countEl.textContent = filtered.length;

    // Smooth reflow animation
    grid.style.transition = 'opacity 180ms ease, transform 180ms ease';
    grid.style.opacity = '0.3';
    grid.style.transform = 'scale(0.99)';

    setTimeout(() => {
      grid.innerHTML = '';

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="empty-gallery" style="grid-column: 1 / -1;">
            <svg class="empty-gallery__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <h3 class="empty-gallery__title">No Paintings Match Your Filter</h3>
            <p class="empty-gallery__desc">
              We couldn't find artworks matching your selected category, size, or price range. 
              Try resetting your filters or exploring another series.
            </p>
            <button class="btn btn--primary" id="emptyResetBtn">Reset All Filters</button>
          </div>
        `;
        document.getElementById('emptyResetBtn')?.addEventListener('click', clearAllFilters);
      } else {
        filtered.forEach((product, idx) => {
          const card = createCard(product);
          // 100-150ms staggered card entry animation
          const staggerIndex = (idx % 12) + 1;
          card.classList.add(`stagger-${staggerIndex}`);
          card.style.animation = `cardStaggerIn 420ms var(--ease-bounce) both`;
          card.style.animationDelay = `${Math.min(idx * 75, 750)}ms`;
          grid.appendChild(card);
        });
        // Bind 3D physical tilt & canvas lift to freshly rendered cards
        window.NanditaArts?.initCardTilt?.(grid);
      }

      grid.style.opacity = '1';
      grid.style.transform = 'scale(1)';
      renderActiveFilterChips();
      // Bind drag scroll on category tabs
      window.NanditaArts?.initDragScroll?.('#categoryTabs');
    }, 180);
  }

  // ── Quick View Modal ──
  function openQuickView(product) {
    const modal = document.getElementById('quickViewModal');
    if (!modal) return;

    modal.querySelector('.quick-view__product-image').src = product.img;
    modal.querySelector('.quick-view__product-image').alt = `${product.title} by Nandita Albright`;
    modal.querySelector('.quick-view__category').textContent = product.category;
    modal.querySelector('.quick-view__title').textContent = product.title;
    modal.querySelector('.quick-view__dims').textContent = `${product.dims} · ${product.medium}`;
    modal.querySelector('.quick-view__price').textContent = `$${product.price.toLocaleString()}`;
    modal.querySelector('.quick-view__desc').textContent = product.description || 'Handcrafted original fine art layered with heavy pigments and palette knife texture.';
    modal.querySelector('.quick-view__detail-link').href = `/product?id=${product.id}`;

    const addBtn = modal.querySelector('.quick-view__add-to-cart');
    if (addBtn) {
      addBtn.onclick = () => {
        addToCart(product);
        closeQuickView();
      };
    }

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // ── Initial setup ──
  document.addEventListener('DOMContentLoaded', async () => {
    updateCartBadge();
    renderCart();

    // Fetch live artworks from backend
    await fetchPaintings();

    // Read initial filters from URL params
    readParamsFromUrl();

    // Render controls & pills
    renderCategoryTabs();
    syncControlInputs();

    // Event listeners on select dropdowns
    document.getElementById('priceFilter')?.addEventListener('change', (e) => {
      filterState.price = e.target.value;
      syncUrlWithState();
      applyFilters();
    });

    document.getElementById('sizeFilter')?.addEventListener('change', (e) => {
      filterState.size = e.target.value;
      syncUrlWithState();
      applyFilters();
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      filterState.sort = e.target.value;
      syncUrlWithState();
      applyFilters();
    });

    // Search overlay & input
    const searchInp = document.getElementById('gallerySearchInput');
    if (searchInp) {
      if (filterState.search) searchInp.value = filterState.search;
      searchInp.addEventListener('input', (e) => {
        filterState.search = e.target.value.trim();
        syncUrlWithState();
        applyFilters();
      });
    }

    // Grid vs List view toggle
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    const productGrid = document.getElementById('productGrid');

    gridBtn?.addEventListener('click', () => {
      if (productGrid) productGrid.style.gridTemplateColumns = '';
      gridBtn.classList.add('is-active');
      listBtn?.classList.remove('is-active');
    });

    listBtn?.addEventListener('click', () => {
      if (productGrid) productGrid.style.gridTemplateColumns = '1fr';
      listBtn?.classList.add('is-active');
      gridBtn?.classList.remove('is-active');
    });

    // Quick view modal listeners
    const qvClose = document.querySelector('.quick-view__close');
    const qvBackdrop = document.querySelector('.quick-view__backdrop');
    qvClose?.addEventListener('click', closeQuickView);
    qvBackdrop?.addEventListener('click', closeQuickView);

    // Initial render
    applyFilters();

    // Browser back/forward navigation support (popstate)
    window.addEventListener('popstate', (e) => {
      readParamsFromUrl();
      renderCategoryTabs();
      syncControlInputs();
      applyFilters();
    });
  });

  // Expose global methods
  window.NanditaArts = window.NanditaArts || {};
  window.NanditaArts.addToCart = addToCart;
  window.NanditaArts.removeFromCart = removeFromCart;
  window.NanditaArts.allProducts = allProducts;
  window.NanditaArts.applyFilters = applyFilters;
  window.NanditaArts.clearAllFilters = clearAllFilters;
})();
