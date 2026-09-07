# Nandita Arts Studio — Website Owner & Handover Guide

Welcome to your new online studio and gallery! This guide was written especially for you, Nandita, in plain, non-technical language so you feel completely at home managing your website, adding your paintings, and fulfilling collector orders.

---

## 1. How to Log In as the Artist / Administrator

There is **no separate admin login page** on the website — this keeps your website secure from unwanted visitors and automated bots.

1. Open your website in any browser.
2. Click the **Account** icon (the small user silhouette in the top-right navigation bar) or go directly to `/login`.
3. In the **Sign In** form, enter your whitelisted admin credentials:
   - **Email:** `nandita@nanditaarts.com` (or the email configured in your `.env` file under `ADMIN_EMAIL`)
   - **Password:** `StudioArt2024!` (or your custom password in `.env`)
4. Click **Sign In**.
5. The website will recognize your email as the verified artist and immediately take you into your **Studio Dashboard** (`/dashboard`).
   - *Note: If a customer logs in with their own email, they are taken to their personal collector account with their purchase history. Only your email has access to the dashboard.*

---

## 2. Managing Your Paintings

### Adding a New Painting
1. Inside your dashboard, click **"Add New Painting"** in the left sidebar (or click the **"+ New Painting"** button in your Overview).
2. Fill out your painting's details:
   - **Title**: (e.g., *Golden Solitude*)
   - **Category**: Pick from your 13 studio categories (*Abstract, Oil, Landscape, Seascape, Texture, Giclée Prints*, etc.)
   - **Price**: Enter numbers only (e.g., `1200` for $1,200)
   - **Dimensions**: (e.g., `30×40"` or `24×36"`)
   - **Medium**: (e.g., *Heavy-body Acrylic with Palette Knife on Canvas*)
   - **Inventory / Stock**: Set to `1` for an original, or higher for limited edition prints.
   - **Story & Description**: Write a personal note about your inspiration, pigments, and technique.
3. Click **Publish Painting**. Your new artwork is immediately live in the gallery and available for collectors to acquire!

### Editing or Deleting a Painting
1. In the sidebar, click **"My Paintings"**.
2. Locate the painting in the list.
3. Click the **Pencil icon (Edit)** to change its price, description, dimensions, or stock.
4. Click the **Trash icon (Delete)** if you wish to remove it permanently from the gallery.

---

## 3. How to View and Fulfill Collector Orders

Whenever a collector purchases a painting:
1. An order confirmation is automatically emailed to the collector with a full receipt.
2. An alert email is sent to your notification address (`CLIENT_NOTIFICATION_EMAIL`).
3. The order appears in your dashboard under **"Orders"**.

### To manage the order:
1. In your dashboard sidebar, click **"Orders"**.
2. You will see:
   - **Order ID** (e.g., `#NA-2024-8492`)
   - **Collector's Name, Email, and Phone**
   - **Shipping Destination Address**
   - **Paintings Acquired**
   - **Total Paid**
3. Update the fulfillment dropdown as you work:
   - **Processing** → When you first receive the order
   - **Crated & Packed** → When you have prepared the custom wooden art box and signed the Certificate of Authenticity
   - **Shipped (In Transit)** → Once handed over to the courier
   - **Delivered** → Once safely received by the collector

---

## 4. Payment Gateways & Switching from Test to Live

Your website is currently running in **Safe Test Mode** so you can test purchasing without real money.

### How to Accept Real Payments:
Your website supports both **Stripe** (ideal for international collectors in the US, Europe, UK) and **Razorpay** (ideal for Indian domestic collectors with UPI, NetBanking, and RuPay).

Open your `.env` configuration file on the server:

#### To use Stripe Live:
```env
PAYMENT_GATEWAY=stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_key
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret
```

#### To use Razorpay Live:
```env
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_secret
```

Once updated and restarted, your checkout will instantly accept real bank cards and deposit funds directly into your bank account!

---

## 5. Helpful Tips for Best Collector Experience

- **High-Quality Photography:** Photograph your paintings in soft, indirect daylight without flash so collectors can appreciate the true vibrancy and impasto knife texture.
- **Promo Codes:** A discount code `TAKE10` is built-in giving 10% off for first-time collectors.
- **Stock Management:** When an original painting sells out, the website automatically marks it as "Sold" so two people cannot buy the same original piece.

*With warm regards and congratulations on your launch!*
