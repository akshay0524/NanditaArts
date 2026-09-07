const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'nandita@nanditaarts.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'StudioArt2024!';
const CLIENT_NOTIFICATION_EMAIL = process.env.CLIENT_NOTIFICATION_EMAIL || ADMIN_EMAIL;
const PAYMENT_GATEWAY = (process.env.PAYMENT_GATEWAY || 'stripe').toLowerCase();

// ── File storage helpers ──
const DATA_DIR = path.join(__dirname, 'data');
const PAINTINGS_FILE = path.join(DATA_DIR, 'paintings.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// ── Middleware ──
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'na_session',
  secret: process.env.SESSION_SECRET || 'nandita-studio-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// ── Strict Admin Check Middleware ──
function isAdmin(req) {
  return !!(
    req.session &&
    req.session.user &&
    req.session.user.email &&
    req.session.user.email.toLowerCase() === ADMIN_EMAIL &&
    req.session.user.isAdmin === true
  );
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required.' });
    }
    return res.redirect('/login?returnUrl=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    return res.redirect('/login?returnUrl=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

// ── Email Notification Dispatcher (Console / Nodemailer Mock) ──
function sendEmailNotifications(order) {
  const customerEmail = order.customer.email;
  const customerName = order.customer.name;
  const orderId = order.id;
  const totalFormatted = '$' + Number(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 });

  const itemsList = order.items.map(i => `• ${i.title} (${i.medium}, ${i.dims}) × ${i.qty} — $${(i.price * i.qty).toLocaleString()}`).join('\n');

  console.log('\n========================================');
  console.log(`✉️  EMAIL SENT TO CUSTOMER: ${customerEmail}`);
  console.log(`Subject: Your Nandita Arts Order Confirmation (#${orderId})`);
  console.log('----------------------------------------');
  console.log(`Dear ${customerName},\n\nThank you for acquiring original art from my studio. Your order #${orderId} is confirmed and will be carefully wrapped and packed with an archival Certificate of Authenticity.\n\nSummary:\n${itemsList}\n\nShipping: $${order.shipping.toFixed(2)}\nEstimated Tax: $${order.tax.toFixed(2)}\nTotal: ${totalFormatted}\n\nShipping to:\n${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}, ${order.shippingAddress.country}\n\nWarm regards,\nNandita Albright\nNandita Arts Studio`);
  console.log('========================================\n');

  console.log('========================================');
  console.log(`🔔 NOTIFICATION SENT TO ARTIST: ${CLIENT_NOTIFICATION_EMAIL}`);
  console.log(`Subject: New Painting Order Received! (#${orderId}) — ${totalFormatted}`);
  console.log('----------------------------------------');
  console.log(`Nandita, you have a new collector order!\nCustomer: ${customerName} (${customerEmail})\nItems:\n${itemsList}\nTotal: ${totalFormatted}\nAddress: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}\nPhone: ${order.customer.phone || 'N/A'}`);
  console.log('========================================\n');
}

// ── PROTECTED ADMIN ROUTES & PAGE LOCKDOWN ──
// Strictly verify session against ADMIN_EMAIL before serving dashboard
app.get('/dashboard', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'artist-dashboard.html'));
});
app.get('/artist-dashboard.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'artist-dashboard.html'));
});

// Deprecate / hide any separate artist-login page — redirect to unified login
app.get(['/artist-login', '/artist-login.html'], (req, res) => {
  res.redirect('/login');
});

// ── AUTH API ENDPOINTS ──
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Strict Admin Check: Only matches ADMIN_EMAIL from environment variables
  if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.user = {
      email: ADMIN_EMAIL,
      name: 'Nandita Albright',
      role: 'admin',
      isAdmin: true
    };
    return res.json({
      success: true,
      message: 'Welcome back to your studio dashboard, Nandita.',
      user: { email: ADMIN_EMAIL, name: 'Nandita Albright', isAdmin: true },
      redirect: '/dashboard'
    });
  }

  // 2. Regular Customer Check
  const users = readJson(USERS_FILE, []);
  const customer = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (customer && customer.password === password) {
    req.session.user = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
      isAdmin: false
    };
    return res.json({
      success: true,
      message: `Welcome back, ${customer.name}!`,
      user: { id: customer.id, email: customer.email, name: customer.name, isAdmin: false },
      redirect: '/account'
    });
  }

  return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
});

// Customer registration: strictly creates customer accounts, no role selector or privilege escalation
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide your name, email, and password.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === ADMIN_EMAIL) {
    return res.status(400).json({ error: 'This email is reserved. Please log in directly.' });
  }

  const users = readJson(USERS_FILE, []);
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const newUser = {
    id: 'cust_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: password,
    role: 'customer', // strictly customer
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  req.session.user = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: 'customer',
    isAdmin: false
  };

  return res.status(201).json({
    success: true,
    message: 'Your collector account has been created.',
    user: { id: newUser.id, email: newUser.email, name: newUser.name, isAdmin: false },
    redirect: '/account'
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('na_session');
    res.json({ success: true, redirect: '/' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session?.user) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      id: req.session.user.id,
      email: req.session.user.email,
      name: req.session.user.name,
      isAdmin: req.session.user.isAdmin === true
    }
  });
});

// ── PAINTINGS API ──
app.get('/api/paintings', (req, res) => {
  let paintings = readJson(PAINTINGS_FILE, []);
  const { category, minPrice, maxPrice, size, sort, search } = req.query;

  if (category && category !== 'All') {
    paintings = paintings.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (minPrice) {
    paintings = paintings.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    paintings = paintings.filter(p => p.price <= Number(maxPrice));
  }

  if (size && size !== 'All') {
    paintings = paintings.filter(p => {
      const match = p.dims.match(/(\d+)\s*×\s*(\d+)/);
      if (!match) return true;
      const maxDim = Math.max(parseInt(match[1]), parseInt(match[2]));
      if (size === 'small') return maxDim <= 20;
      if (size === 'medium') return maxDim > 20 && maxDim <= 30;
      if (size === 'large') return maxDim > 30;
      return true;
    });
  }

  if (search) {
    const q = search.toLowerCase();
    paintings = paintings.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.medium.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (sort) {
    if (sort === 'price-asc') paintings.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') paintings.sort((a, b) => b.price - a.price);
    else if (sort === 'name') paintings.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'new') paintings.sort((a, b) => b.id - a.id);
  }

  res.json({ total: paintings.length, paintings });
});

app.get('/api/paintings/:id', (req, res) => {
  const paintings = readJson(PAINTINGS_FILE, []);
  const painting = paintings.find(p => p.id === parseInt(req.params.id));
  if (!painting) return res.status(404).json({ error: 'Artwork not found.' });
  res.json(painting);
});

// Admin-only painting CRUD
app.post('/api/paintings', requireAdmin, (req, res) => {
  const paintings = readJson(PAINTINGS_FILE, []);
  const { title, category, price, dims, medium, img, badge, stock, description, featured } = req.body;

  if (!title || !category || !price) {
    return res.status(400).json({ error: 'Title, category, and price are required.' });
  }

  const newPainting = {
    id: paintings.length ? Math.max(...paintings.map(p => p.id)) + 1 : 1,
    title: title.trim(),
    category: category.trim(),
    price: Number(price),
    dims: dims ? dims.trim() : '24×36"',
    medium: medium ? medium.trim() : 'Acrylic on Canvas',
    img: img || 'assets/images/p1.jpg',
    badge: badge || null,
    stock: stock !== undefined ? Number(stock) : 1,
    description: description ? description.trim() : '',
    featured: !!featured
  };

  paintings.unshift(newPainting);
  writeJson(PAINTINGS_FILE, paintings);
  res.status(201).json({ success: true, painting: newPainting });
});

app.put('/api/paintings/:id', requireAdmin, (req, res) => {
  const paintings = readJson(PAINTINGS_FILE, []);
  const id = parseInt(req.params.id);
  const index = paintings.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Artwork not found.' });

  const updated = {
    ...paintings[index],
    ...req.body,
    id,
    price: req.body.price !== undefined ? Number(req.body.price) : paintings[index].price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : paintings[index].stock
  };

  paintings[index] = updated;
  writeJson(PAINTINGS_FILE, paintings);
  res.json({ success: true, painting: updated });
});

app.delete('/api/paintings/:id', requireAdmin, (req, res) => {
  let paintings = readJson(PAINTINGS_FILE, []);
  const id = parseInt(req.params.id);
  paintings = paintings.filter(p => p.id !== id);
  writeJson(PAINTINGS_FILE, paintings);
  res.json({ success: true, message: 'Artwork deleted.' });
});

// ── CHECKOUT & ORDERS API ──
app.get('/api/config/payment', (req, res) => {
  res.json({
    gateway: PAYMENT_GATEWAY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    isTestMode: true
  });
});

app.post('/api/checkout/create-payment', (req, res) => {
  const { items, shippingOption, promoCode, shippingAddress } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const allPaintings = readJson(PAINTINGS_FILE, []);
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const p = allPaintings.find(paint => paint.id === item.id);
    if (!p) return res.status(400).json({ error: `Artwork ID ${item.id} not found.` });
    if (p.stock < item.qty) {
      return res.status(400).json({ error: `"${p.title}" is currently out of stock or requested quantity unavailable.` });
    }
    subtotal += p.price * item.qty;
    verifiedItems.push({ ...p, qty: item.qty });
  }

  // Discount
  let discount = 0;
  if (promoCode && promoCode.toUpperCase() === 'TAKE10') {
    discount = subtotal * 0.10;
  }

  // Shipping
  let shipping = 0;
  if (shippingOption === 'express') {
    shipping = 65;
  } else {
    shipping = (subtotal - discount) >= 200 ? 0 : 25;
  }

  // Tax (estimated 6.5% standard, or by region)
  const tax = (subtotal - discount) * 0.065;
  const total = (subtotal - discount) + shipping + tax;

  const paymentIntentId = 'pi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  res.json({
    success: true,
    paymentIntentId,
    gateway: PAYMENT_GATEWAY,
    subtotal,
    discount,
    shipping,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  });
});

app.post('/api/orders', (req, res) => {
  const { customer, shippingAddress, items, shippingOption, promoCode, paymentDetails } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }
  if (!customer?.email || !customer?.name || !shippingAddress?.address || !shippingAddress?.city) {
    return res.status(400).json({ error: 'Complete customer and shipping address information is required.' });
  }

  // Verify paintings & stock
  const allPaintings = readJson(PAINTINGS_FILE, []);
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const p = allPaintings.find(paint => paint.id === item.id);
    if (!p) return res.status(400).json({ error: `Item "${item.title}" no longer exists.` });
    if (p.stock < item.qty) {
      return res.status(400).json({ error: `"${p.title}" is out of stock.` });
    }
    subtotal += p.price * item.qty;
    orderItems.push({
      id: p.id,
      title: p.title,
      price: p.price,
      medium: p.medium,
      dims: p.dims,
      img: p.img,
      qty: item.qty
    });
  }

  let discount = 0;
  if (promoCode && promoCode.toUpperCase() === 'TAKE10') {
    discount = subtotal * 0.10;
  }

  const shipping = shippingOption === 'express' ? 65 : ((subtotal - discount) >= 200 ? 0 : 25);
  const tax = Math.round(((subtotal - discount) * 0.065) * 100) / 100;
  const total = Math.round(((subtotal - discount) + shipping + tax) * 100) / 100;

  // Generate friendly Order ID
  const orderId = 'NA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: orderId,
    createdAt: new Date().toISOString(),
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone ? customer.phone.trim() : ''
    },
    shippingAddress: {
      address: shippingAddress.address.trim(),
      apt: shippingAddress.apt ? shippingAddress.apt.trim() : '',
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      zip: shippingAddress.zip.trim(),
      country: shippingAddress.country || 'United States'
    },
    shippingOption: shippingOption || 'standard',
    items: orderItems,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    payment: {
      gateway: paymentDetails?.gateway || PAYMENT_GATEWAY,
      status: 'paid',
      transactionId: paymentDetails?.transactionId || ('txn_' + Date.now()),
      cardBrand: paymentDetails?.cardBrand || 'Visa',
      cardLast4: paymentDetails?.cardLast4 || '4242'
    },
    status: 'Processing',
    trackingNumber: null
  };

  // Decrement stock in paintings store
  for (const item of orderItems) {
    const p = allPaintings.find(paint => paint.id === item.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
    }
  }
  writeJson(PAINTINGS_FILE, allPaintings);

  // Save order
  const orders = readJson(ORDERS_FILE, []);
  orders.unshift(newOrder);
  writeJson(ORDERS_FILE, orders);

  // Send notifications
  sendEmailNotifications(newOrder);

  res.status(201).json({
    success: true,
    orderId: newOrder.id,
    order: newOrder
  });
});

app.get('/api/orders/my-orders', requireAuth, (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const myOrders = orders.filter(o => o.customer.email.toLowerCase() === req.session.user.email.toLowerCase());
  res.json({ total: myOrders.length, orders: myOrders });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  res.json({ total: orders.length, orders });
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.body.status) order.status = req.body.status;
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;

  writeJson(ORDERS_FILE, orders);
  res.json({ success: true, order });
});

// ── HTML PAGE ROUTES ──
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'checkout.html')));
app.get('/order-confirmation', (req, res) => res.sendFile(path.join(__dirname, 'order-confirmation.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/account', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));

// ── Static assets ──
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Static HTML fallback
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/gallery.html', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/product.html', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/cart.html', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));
app.get('/checkout.html', (req, res) => res.sendFile(path.join(__dirname, 'checkout.html')));
app.get('/order-confirmation.html', (req, res) => res.sendFile(path.join(__dirname, 'order-confirmation.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/account.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'account.html')));

// SEO Files
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    const notFoundPage = path.join(__dirname, '404.html');
    if (fs.existsSync(notFoundPage)) {
      return res.sendFile(notFoundPage);
    }
  }
  res.json({ error: 'Not Found' });
});

// 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500);
  if (req.accepts('html')) {
    const errorPage = path.join(__dirname, '500.html');
    if (fs.existsSync(errorPage)) {
      return res.sendFile(errorPage);
    }
  }
  res.json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🎨 Nandita Arts Server running on http://localhost:${PORT}`);
  console.log(`🔒 Admin email whitelisted: ${ADMIN_EMAIL}`);
  console.log(`💳 Payment Gateway configured: ${PAYMENT_GATEWAY.toUpperCase()} (Test Mode Enabled)`);
  console.log(`========================================\n`);
});
