# Nandita Arts — Original Fine Art & Giclée Prints

**Live Demo (GitHub Pages):** https://akshay0524.github.io/NanditaArts/

A premium e-commerce portfolio for original paintings and giclée prints by **Nandita Albright**. Built with vanilla HTML, CSS, and JavaScript — no framework dependencies.

---

## Features

- 🎨 **Gallery** with real-time multi-filter (category, price, size, sort, search)
- 🛒 **Cart** with localStorage persistence, promo codes, and quantity management
- ✨ **Editorial Parallax Section** — scroll-linked polaroid image reveals
- 🌙 **Dark / Light theme toggle** with no-FOUC preload
- 📱 **Fully mobile-optimised** — touch gestures, 44px tap targets, swipe-to-close nav
- 🎞️ **Premium animations** — 3D card tilt, drag-to-scroll carousels, reveal-on-scroll

---

## GitHub Pages Demo — What Works vs What's Limited

> This static version is hosted on GitHub Pages, which serves **only static files**.  
> The Node.js backend (`server.js`) does **not run** in this deployment.

| Feature | Status | Notes |
|---------|--------|-------|
| Home page | ✅ **Full** | All animations, theme toggle, mobile |
| Gallery & filtering | ✅ **Full** | Uses embedded fallback product data |
| Product pages | ✅ **Full** | Cart add/remove works via localStorage |
| Cart | ✅ **Full** | 100% localStorage-based |
| Dark/light theme | ✅ **Full** | localStorage + CSS variables |
| All animations | ✅ **Full** | Pure client-side |
| Checkout UI | ⚠️ **Demo mode** | Form validates and simulates an order locally |
| Login / Account | ⚠️ **Demo mode** | Shows a sample profile; auth needs backend |
| Artist Dashboard | ❌ **Disabled** | Requires Node.js session auth + file writes |
| Order confirmation emails | ❌ **Disabled** | Requires Node.js `nodemailer` / SMTP |
| Real payment processing | ❌ **Disabled** | Requires Stripe/Razorpay server-side keys |
| Stock management | ❌ **Disabled** | Requires server-side `data/paintings.json` writes |

**For the full functional site** (including real checkout, auth, and the artist dashboard), deploy with:
- **[Vercel](https://vercel.com)** — `vercel --prod` (auto-detects Node.js)
- **[Render](https://render.com)** — connect GitHub, set start command to `node server.js`
- **[Railway](https://railway.app)** — one-click Node.js deploy

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file and fill in your credentials
cp .env.example .env

# Start the development server
npm run dev
# → http://localhost:3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Email address for the artist/admin account |
| `ADMIN_PASSWORD` | Admin password (use a strong value in production) |
| `SESSION_SECRET` | Random secret for express-session |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key (test or live) |
| `STRIPE_SECRET_KEY` | Stripe secret key — **never expose this** |
| `RAZORPAY_KEY_ID` | Razorpay key ID (optional alternative gateway) |

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES2022+)
- **Backend:** Node.js + Express.js
- **Storage:** JSON flat files (paintings, orders, users)
- **Fonts:** Google Fonts (Cormorant Garamond, Outfit)
- **Deployment (static):** GitHub Pages via `peaceiris/actions-gh-pages`
- **Deployment (full):** Any Node.js host — Vercel, Render, Railway

---

## License

All artwork images and content © Nandita Albright. All rights reserved.  
Code: MIT License.
