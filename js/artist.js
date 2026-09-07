/* ============================================
   ARTIST STUDIO DASHBOARD (SERVER-BACKED) — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  let currentPaintings = [];
  let currentOrders = [];
  let imageFiles = [];
  let editingId = null;

  const isStaticHost = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  // ── Auth Verification on Page Load ──
  async function verifyAdminAuth() {
    if (isStaticHost) {
      return true; // Allow dashboard preview on static host
    }
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated || !data.user?.isAdmin) {
        window.location.href = 'artist-login.html';
        return false;
      }
      return true;
    } catch (err) {
      return true; // Live server unreachable, allow demo access
    }
  }

  async function handleLogout() {
    if (!isStaticHost) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    sessionStorage.removeItem('na_artist_logged_in');
    window.location.href = 'artist-login.html';
  }

  // ── Data Loaders from REST Endpoints / LocalStorage ──
  async function loadPaintings() {
    try {
      const res = await fetch('/api/paintings');
      if (res.ok) {
        const data = await res.json();
        currentPaintings = data.paintings || [];
        renderPaintingsTable();
        renderOverviewPreview();
        updateDashboardStats();
        return;
      }
    } catch (err) { }

    // Fallback: check localStorage or fetch data/paintings.json
    const saved = localStorage.getItem('na_studio_paintings');
    if (saved) {
      try {
        currentPaintings = JSON.parse(saved);
      } catch (e) { currentPaintings = []; }
    }

    if (!currentPaintings || currentPaintings.length === 0) {
      try {
        const res = await fetch('data/paintings.json');
        if (res.ok) {
          const data = await res.json();
          currentPaintings = data || [];
        }
      } catch (e) { }
    }

    if (!currentPaintings || currentPaintings.length === 0) {
      currentPaintings = [
        { id: 1, title: 'Crimson Reverie', category: 'Abstract', price: 1450, dims: '30×40"', medium: 'Acrylic with Palette Knife', stock: 1, img: 'assets/images/p1.jpg', description: 'Heavy impasto knife work exploring passion and quiet introspection.' },
        { id: 2, title: 'Urban Nocturne', category: 'Cityscape', price: 1200, dims: '24×36"', medium: 'Oil on Linen', stock: 1, img: 'assets/images/p2.jpg', description: 'Atmospheric nocturnal city study in rich Prussian blues and amber reflections.' },
        { id: 3, title: 'Bloom & Scatter', category: 'Flower', price: 950, dims: '20×24"', medium: 'Oil on Canvas', stock: 1, img: 'assets/images/p3.jpg', description: 'Loose, gestural floral strokes capturing the fleeting beauty of peonies.' },
        { id: 4, title: 'Oceanic Drift', category: 'Seascape', price: 1650, dims: '36×48"', medium: 'Mixed Media on Canvas', stock: 1, img: 'assets/images/p4.jpg', description: 'Expansive seascape layered with quartz dust and sea mineral pigments.' },
        { id: 5, title: 'Jazz Composition', category: 'Jackson Pollock Style', price: 2100, dims: '40×60"', medium: 'Enamel & Acrylic on Raw Duck Canvas', stock: 1, img: 'assets/images/p5.jpg', description: 'Rhythmic action painting with intricate drips and interwoven cadence.' },
        { id: 6, title: 'Golden Meadow', category: 'Landscape', price: 1350, dims: '28×38"', medium: 'Oil on Canvas', stock: 0, img: 'assets/images/p6.jpg', description: 'Sun-drenched field captured in golden hour light.' }
      ];
      localStorage.setItem('na_studio_paintings', JSON.stringify(currentPaintings));
    }

    renderPaintingsTable();
    renderOverviewPreview();
    updateDashboardStats();
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        currentOrders = data.orders || [];
        renderOrdersTable();
        return;
      }
    } catch (err) { }

    let savedOrders = JSON.parse(localStorage.getItem('na_orders') || '[]');
    const lastOrder = JSON.parse(localStorage.getItem('na_last_order') || 'null');
    if (lastOrder && !savedOrders.some(o => o.id === lastOrder.id)) {
      savedOrders.unshift(lastOrder);
    }

    if (savedOrders.length === 0) {
      savedOrders = [
        {
          id: 'NA-2024-8492',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          customer: { name: 'Eleanor Vance', email: 'eleanor.vance@artcollector.com', phone: '+1 (415) 890-1234' },
          shippingAddress: { address: '742 Evergreen Terrace', city: 'San Francisco', state: 'CA', zip: '94102' },
          items: [{ title: 'Crimson Reverie', dims: '30×40"', qty: 1, price: 1450, img: 'assets/images/p1.jpg' }],
          total: 1450.00,
          payment: { status: 'paid', cardBrand: 'Visa', cardLast4: '4242' },
          status: 'Crated & Packed'
        },
        {
          id: 'NA-2024-8493',
          createdAt: new Date().toISOString(),
          customer: { name: 'Marcus Thorne', email: 'm.thorne@designstudio.ny', phone: '+1 (212) 555-0199' },
          shippingAddress: { address: '120 Wooster St, Apt 4B', city: 'New York', state: 'NY', zip: '10012' },
          items: [{ title: 'Oceanic Drift', dims: '36×48"', qty: 1, price: 1650, img: 'assets/images/p4.jpg' }],
          total: 1650.00,
          payment: { status: 'paid', cardBrand: 'Mastercard', cardLast4: '8821' },
          status: 'Processing'
        }
      ];
      localStorage.setItem('na_orders', JSON.stringify(savedOrders));
    }

    currentOrders = savedOrders;
    renderOrdersTable();
  }

  // ── Stats update ──
  function updateDashboardStats() {
    const totalEl = document.getElementById('stat-total');
    const publishedEl = document.getElementById('stat-published');
    const draftsEl = document.getElementById('stat-drafts');

    if (totalEl) totalEl.textContent = currentPaintings.length;
    if (publishedEl) publishedEl.textContent = currentPaintings.filter(p => p.stock > 0).length;
    if (draftsEl) draftsEl.textContent = currentPaintings.filter(p => p.stock === 0).length;
  }

  // ── Overview Preview ──
  function renderOverviewPreview() {
    const container = document.getElementById('overview-preview');
    if (!container) return;

    if (currentPaintings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No paintings listed yet</h3>
          <p style="margin-bottom:var(--space-5);">Add your first studio original to present to collectors.</p>
          <button class="btn btn--primary" onclick="window.showAddForm()">Add First Painting</button>
        </div>`;
      return;
    }

    const recent = currentPaintings.slice(0, 4);
    container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--space-4);padding:var(--space-5);">` +
      recent.map(p => `
        <div style="border-radius:var(--radius-md);overflow:hidden;background:var(--color-surface-2);">
          <div style="aspect-ratio:3/4;overflow:hidden;background:var(--color-surface);">
            <img src="${p.img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <div style="padding:var(--space-3);">
            <div style="font-size:var(--fs-xs);color:var(--color-off-white);font-family:var(--font-display);">${p.title}</div>
            <div style="font-size:11px;color:var(--color-gold);margin-top:2px;">$${Number(p.price).toLocaleString()} · ${p.category}</div>
          </div>
        </div>`).join('') + `</div>`;
  }

  // ── Paintings Table ──
  function renderPaintingsTable() {
    const tbody = document.querySelector('.paintings-table tbody');
    if (!tbody) return;

    if (currentPaintings.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center; padding: var(--space-10); color: var(--color-beige-dim);">
          No paintings listed yet. <button class="btn btn--ghost" style="font-size:var(--fs-sm);" onclick="showAddForm()">Add your first painting →</button>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = currentPaintings.map(p => `
      <tr>
        <td>
          <div class="painting-row__thumb">
            <img src="${p.img}" alt="${p.title}">
          </div>
        </td>
        <td>
          <div class="painting-row__title">${p.title}</div>
          <div class="painting-row__category">${p.category} · ${p.medium || 'Acrylic on Canvas'}</div>
        </td>
        <td style="color:var(--color-gold);">$${Number(p.price).toLocaleString()}</td>
        <td>${p.dims || '24×36"'}</td>
        <td>
          <span class="painting-row__status painting-row__status--${p.stock > 0 ? 'published' : 'draft'}">
            <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
            ${p.stock > 0 ? `In Stock (${p.stock})` : 'Sold Out'}
          </span>
        </td>
        <td>
          <div class="painting-row__actions">
            <button class="row-action-btn" title="Edit Painting" onclick="window.editPaintingById(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="row-action-btn row-action-btn--delete" title="Delete Painting" onclick="window.deletePaintingById(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ── Orders Table ──
  function renderOrdersTable() {
    const tbody = document.querySelector('#adminOrdersTable tbody');
    if (!tbody) return;

    if (currentOrders.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center; padding: var(--space-12); color: var(--color-beige-dim);">
          No collector orders received yet. Once collectors check out, their orders and shipping details will appear here.
        </td></tr>`;
      return;
    }

    tbody.innerHTML = currentOrders.map(o => `
      <tr>
        <td>
          <strong style="color:var(--color-gold);">#${o.id}</strong>
          <div style="font-size:11px;color:var(--color-beige-dim);">${new Date(o.createdAt).toLocaleDateString()}</div>
        </td>
        <td>
          <div style="color:var(--color-off-white);">${o.customer.name}</div>
          <div style="font-size:11px;color:var(--color-beige-dim);">${o.customer.email}</div>
          <div style="font-size:11px;color:var(--color-beige-dim);">${o.shippingAddress.city}, ${o.shippingAddress.state}</div>
        </td>
        <td>
          <div style="font-size:var(--fs-xs);line-height:1.4;">
            ${o.items.map(i => `<div>• ${i.title} × ${i.qty}</div>`).join('')}
          </div>
        </td>
        <td>
          <strong style="color:var(--color-off-white);">$${Number(o.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        </td>
        <td>
          <span style="font-size:11px;color:var(--color-success);">Paid via ${o.payment.cardBrand || 'Card'}</span>
          <div style="font-size:10px;color:var(--color-beige-dim);">•••• ${o.payment.cardLast4 || '4242'}</div>
        </td>
        <td>
          <select onchange="window.updateOrderStatus('${o.id}', this.value)" style="background:var(--color-surface-2);color:var(--color-off-white);border:1px solid rgba(214,203,182,0.2);border-radius:4px;padding:3px 6px;font-size:11px;cursor:pointer;">
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Crated & Packed" ${o.status === 'Crated & Packed' ? 'selected' : ''}>Crated & Packed</option>
            <option value="Shipped (In Transit)" ${o.status === 'Shipped (In Transit)' ? 'selected' : ''}>Shipped (In Transit)</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </td>
      </tr>
    `).join('');
  }

  // ── Global Handlers for Dashboard Actions ──
  window.editPaintingById = function (id) {
    const painting = currentPaintings.find(p => p.id === id);
    if (!painting) return;
    editingId = id;
    showAddForm(painting);
  };

  window.deletePaintingById = async function (id) {
    if (!confirm('Permanently delete this painting from your studio collection?')) return;
    if (confirm('Are you sure you want to delete this painting from your portfolio?')) {
      try {
        const res = await fetch(`/api/paintings/${id}`, { method: 'DELETE' });
        if (res.ok) {
          window.NanditaArts?.showToast?.('Painting removed from collection.');
          await loadPaintings();
          return;
        }
      } catch (err) { }

      // LocalStorage fallback for GitHub Pages
      currentPaintings = currentPaintings.filter(p => p.id != id);
      localStorage.setItem('na_studio_paintings', JSON.stringify(currentPaintings));
      renderPaintingsTable();
      renderOverviewPreview();
      updateDashboardStats();
      window.NanditaArts?.showToast?.('Painting removed from portfolio.');
    }
  };

  window.updateOrderStatus = async function (orderId, newStatus) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        window.NanditaArts?.showToast?.(`Order #${orderId} status updated to ${newStatus}`);
        return;
      }
    } catch (err) { }

    const order = currentOrders.find(o => o.id == orderId);
    if (order) {
      order.status = newStatus;
      localStorage.setItem('na_orders', JSON.stringify(currentOrders));
      window.NanditaArts?.showToast?.(`Order #${orderId} status updated to ${newStatus}`);
    }
  };

  window.showAddForm = function (painting = null) {
    const addPanel = document.getElementById('panel-add');
    if (!addPanel) return;

    document.querySelectorAll('.dashboard-panel').forEach(p => p.style.display = 'none');
    addPanel.style.display = 'block';

    document.querySelectorAll('.dashboard-nav__item').forEach(i => i.classList.remove('is-active'));
    document.querySelector('.dashboard-nav__item[data-panel="panel-add"]')?.classList.add('is-active');

    const form = document.getElementById('addPaintingForm');
    if (!form) return;

    if (painting) {
      document.getElementById('f-title').value = painting.title || '';
      document.getElementById('f-category').value = painting.category || 'Abstract';
      document.getElementById('f-price').value = painting.price || '';
      document.getElementById('f-dims').value = painting.dims || '';
      document.getElementById('f-medium').value = painting.medium || '';
      document.getElementById('f-description').value = painting.description || '';
      document.getElementById('f-stock').value = painting.stock !== undefined ? painting.stock : 1;
      document.getElementById('f-badge').value = painting.badge || '';
    } else {
      editingId = null;
      form.reset();
    }
  };

  // ── Form Submission (Save Painting) ──
  function setupAddPaintingForm() {
    const form = document.getElementById('addPaintingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('f-title')?.value.trim();
      const category = document.getElementById('f-category')?.value.trim();
      const price = Number(document.getElementById('f-price')?.value);
      const dims = document.getElementById('f-dims')?.value.trim() || '24×36"';
      const medium = document.getElementById('f-medium')?.value.trim() || 'Acrylic on Canvas';
      const description = document.getElementById('f-description')?.value.trim();
      const stock = parseInt(document.getElementById('f-stock')?.value) || 1;
      const badge = document.getElementById('f-badge')?.value.trim() || null;

      if (!title || !category || !price) {
        alert('Please fill in required fields (Title, Category, Price).');
        return;
      }

      const payload = {
        title,
        category,
        price,
        dims,
        medium,
        description,
        stock,
        badge,
        img: 'assets/images/p1.jpg'
      };

      try {
        let res;
        if (editingId) {
          res = await fetch(`/api/paintings/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/paintings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res && res.ok) {
          window.NanditaArts?.showToast?.(editingId ? 'Painting updated successfully.' : 'New painting published to gallery!');
          editingId = null;
          form.reset();
          await loadPaintings();
          document.querySelector('.dashboard-nav__item[data-panel="panel-paintings"]')?.click();
          return;
        }
      } catch (err) { }

      // Fallback for static GitHub Pages mode
      if (editingId) {
        const idx = currentPaintings.findIndex(p => p.id == editingId);
        if (idx !== -1) {
          currentPaintings[idx] = { ...currentPaintings[idx], ...payload, id: editingId };
        }
        window.NanditaArts?.showToast?.('Painting updated (saved in demo mode)');
      } else {
        const newId = Date.now();
        currentPaintings.unshift({ ...payload, id: newId });
        window.NanditaArts?.showToast?.('New painting published to gallery!');
      }

      localStorage.setItem('na_studio_paintings', JSON.stringify(currentPaintings));
      editingId = null;
      form.reset();
      renderPaintingsTable();
      renderOverviewPreview();
      updateDashboardStats();
      document.querySelector('.dashboard-nav__item[data-panel="panel-paintings"]')?.click();
    });
  }

  // ── Init Dashboard ──
  document.addEventListener('DOMContentLoaded', async () => {
    const authed = await verifyAdminAuth();
    if (!authed) return;

    // Logout
    document.querySelector('.dashboard-logout')?.addEventListener('click', handleLogout);

    // Navigation panel toggles
    document.querySelectorAll('.dashboard-nav__item[data-panel]').forEach(item => {
      item.addEventListener('click', function () {
        const target = this.dataset.panel;
        document.querySelectorAll('.dashboard-nav__item').forEach(i => i.classList.remove('is-active'));
        this.classList.add('is-active');

        document.querySelectorAll('.dashboard-panel').forEach(p => {
          p.style.display = p.id === target ? 'block' : 'none';
        });

        if (target === 'panel-paintings') renderPaintingsTable();
        if (target === 'panel-overview') renderOverviewPreview();
        if (target === 'panel-orders') loadOrders();

        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      });
    });

    // Mobile menu toggle with backdrop
    const menuBtn = document.getElementById('dashMenuBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.querySelector('.dashboard-sidebar');

    let backdrop = document.querySelector('.dashboard-sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'dashboard-sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    function openSidebar() {
      sidebar?.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar?.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (sidebar?.classList.contains('is-open')) closeSidebar();
        else openSidebar();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    backdrop.addEventListener('click', closeSidebar);

    // Refresh orders button
    document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadOrders);

    setupAddPaintingForm();

    // Initial load
    await loadPaintings();
    await loadOrders();
  });
})();
