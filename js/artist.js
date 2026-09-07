/* ============================================
   ARTIST STUDIO DASHBOARD (SERVER-BACKED) — Nandita Arts
   ============================================ */
(function () {
  'use strict';

  let currentPaintings = [];
  let currentOrders = [];
  let imageFiles = [];
  let editingId = null;

  // ── Auth Verification on Page Load ──
  async function verifyAdminAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated || !data.user?.isAdmin) {
        window.location.href = '/login?returnUrl=/dashboard';
        return false;
      }
      return true;
    } catch (err) {
      window.location.href = '/login?returnUrl=/dashboard';
      return false;
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'login.html';
  }

  // ── Data Loaders from REST Endpoints ──
  async function loadPaintings() {
    try {
      const res = await fetch('/api/paintings');
      const data = await res.json();
      currentPaintings = data.paintings || [];
      renderPaintingsTable();
      renderOverviewPreview();
      updateDashboardStats();
    } catch (err) {
      console.error('Failed to load paintings:', err);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        currentOrders = data.orders || [];
        renderOrdersTable();
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
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
    try {
      const res = await fetch(`/api/paintings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.NanditaArts?.showToast?.('Painting removed from collection.');
        await loadPaintings();
      } else {
        alert('Failed to delete painting.');
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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
        img: 'assets/images/p1.jpg' // Default studio image if none uploaded
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

        if (res.ok) {
          window.NanditaArts?.showToast?.(editingId ? 'Painting updated successfully.' : 'New painting published to gallery!');
          editingId = null;
          form.reset();
          await loadPaintings();

          // Switch back to paintings panel
          document.querySelector('.dashboard-nav__item[data-panel="panel-paintings"]')?.click();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Could not save painting.');
        }
      } catch (err) {
        console.error(err);
      }
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
      });
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('dashMenuBtn');
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    }

    // Refresh orders button
    document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadOrders);

    setupAddPaintingForm();

    // Initial load
    await loadPaintings();
    await loadOrders();
  });
})();
