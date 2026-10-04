# 🍔 WOF RUSH — Coimbatore Street Endless Runner
> **Run. Grab. Dodge. Deliver.**

**WOF RUSH** is an arcade 3D endless runner built specifically for **Western Outdoor Foods (WOF)**, set in an exaggerated, vibrant streetscape of **Selvapuram, Coimbatore**.

Instead of being a generic endless runner, WOF RUSH features a fast-paced **Delivery Run loop**, the signature **WOF Meal Combo system**, authentic local obstacles (Auto-rickshaws, chai vendor carts, street scooters), local Coimbatore Easter eggs, dynamic day-to-night lighting transitions, procedural Web Audio SFX & music, and a **WOF Voucher Reward integration** that connects gameplay directly to real orders.

---

## 🎮 Key Features & Mechanics

### 1. The Three-Lane Runner System & Anime Human Runner
- **Anime Human Delivery Runner:**
  - Designed with sculpted, human anime proportions: stylish layered anime hair with WOF sunset orange tip highlights, expressive anime eyes, urban varsity windbreaker jacket, delivery smartwatch scanner on wrist, athletic streetwear joggers, and sculpted high-top anime sneakers.
  - Aerodynamic courier sling bag across the back (replacing the old rectangular box design!).
- **3 Lanes**: Left, Center, Right (`-2.2`, `0.0`, `+2.2`).
- **Smooth Physics**: Lateral spring interpolation with banking tilt, responsive jumping with tucked air poses, low-friction sliding with dust particles, and zero camera clipping glitches.
- **Smartphone Touch Controls**:
  - **Ultra-Responsive Swipe Gestures**: Swipe anywhere on screen (Left, Right, Jump, Slide) with instant touchmove recognition and automatic pull-to-refresh prevention.
  - **On-Screen Arcade Touch Buttons**: Ergonomic touch buttons (`◀`, `▶`, `▲ JUMP`, `▼ SLIDE`) designed for thumb reach on mobile screens.

---

### 2. Signature WOF Meal Combo System
Instead of collecting generic coins, players collect stylized 3D WOF menu items:
- **Main**: 🍔 Burger, 🍕 Pizza, 🌯 Wrap
- **Side**: 🍟 Crispy Fries, 🧇 Golden Waffle
- **Drink**: 🥤 Soda / Cold Drink, 🧋 Falooda / Shake

**The WOF Meal Formula:**
```text
[ MAIN ] + [ SIDE ] + [ DRINK ]
              ↓
    🔥 WOF MEAL COMPLETE! 🔥
         +500 POINTS
     COMBO MULTIPLIER +1
```
- **Same-Food Streaks**: Collecting 3 of the same item in a row triggers `BURGER COMBO x3! (+150 PTS)`.
- **Combo Scaling**: Combos stack up to **x12 WOF Rush**!

---

### 3. Delivery Run Missions
Every 350–500 meters, an emergency order dispatch sounds:
```text
ORDER #1042 DISPATCHED!
🍔 Burger: 1/1
🍟 Fries:  0/1
🥤 Drink:  1/1
⏱️ TIME REMAINING: 25s
```
- During a delivery run, target items spawn with higher frequency and special markers.
- Completing the order before time runs out awards **+2,500 PTS**, celebratory banners, and crowd cheers!
- If time expires, the order goes cold, and standard running continues.

---

### 4. Authentic Coimbatore Obstacles & Easter Eggs
- 🛺 **Coimbatore Auto-Rickshaw**: The iconic green & yellow 3-wheeler registered with "TN 38 WOF 1042".
- 🛵 **Street Scooter**: Classic city commuter scooter.
- 🚧 **Jumpable Construction Barriers**: Yellow/black hazard striped road barriers with flashing amber lights.
- ⚠️ **Overhead Slide Barriers**: Low-clearance scaffolding banners that force players to slide duck.
- ☕ **Coimbatore Chai & Snack Cart**: Traditional wooden street pushcart with tea urn and canopy.
- 🌟 **The Golden Fry (Easter Egg)**: Ultra-rare glowing golden fry with rotating halo ring worth **+1,000 PTS**!
- 🍔 **Giant Rolling Burger Hazard**: Rare oversized burger barrel rolling down the street!
- 🧑‍🍳 **Waving WOF Mascot**: Mascot standing beside roadside shops; jumping near it triggers **"SECRET FOUND! +500 PTS"**.
- 🌴 **Selvapuram Scenery**: Tamil storefront signs (*அண்ணா டீ ஸ்டால், கோவை பேக்கரி, செல்வபுரம் WOF*), rooftop Sintex water tanks, and coconut trees.

---

### 5. Power-Up Arsenal
- 🛡️ **Full Meal Shield** (15s): Absorbs 1 vehicle collision with a forcefield shatter shockwave.
- 🧲 **Fry Magnet** (10s): Pulls all nearby food items directly toward the runner.
- ⚡ **Turbo Drink / WOF Boost** (6s): Super speed, camera FOV stretch, and 3x score multiplier!
- 🍔 **Burger Mode** (7s): Player transforms into a giant rolling burger, smashing obstacles into confetti debris!

---

### 6. Dynamic Day / Sunset / Neon Night Cycle
- **0 – 800m**: Sunny morning in Selvapuram, Coimbatore.
- **800 – 1,800m**: Golden Tamil Nadu sunset with rich orange and amber hues.
- **1,800m+**: Electric Kovai Neon Night with glowing shopfronts and indigo street fog!

---

### 7. 1,000m Voucher Requirement & Lead Capture
- **1,000m Milestone Rule**: Offers and discount coupons are **ONLY provided after the runner achieves at least 1,000 meters**!
  - **Under 1,000m**: Displays a locked progress bar showing exact meters run and meters remaining to unlock rewards.
  - **1,000m – 1,999m**: Unlocks **FREE FRIES** (`WOF-FREEFRIES-XXXX`)
  - **2,000m – 2,999m**: Unlocks **₹50 OFF** on orders above ₹299 (`WOF-MEAL-50-XXXX`)
  - **3,000m+**: Unlocks **₹100 OFF VIP FEAST** on orders above ₹499 (`WOFRUSH-100-XXXX`)
- **Customer Phone Number Capture**:
  - At the end of every run, players enter their **Name** and **10-digit Mobile Number** to claim and register their coupons.
  - Leads are saved in local storage and posted to the server database (`data/leads.json`).

---

### 8. Stripe-Style Restaurant Intelligence Console
- **Access**: Click the **🔑** button on the home screen footer, press `Shift + A`, or navigate to `http://localhost:8080/#admin`.
- **Passcode**: Default passcode is `wof2026` (or `admin`).
- **Modern Stripe-Like Dashboard Layout**:
  - **Collapsible Left Sidepanel**: Clean navigation with brand badges, quick-status production indicators, and live record counters.
  - **Top Application Bar**: Interactive breadcrumb navigation, live server database sync indicator, and dynamic primary action button.
- **Core Modules & Capabilities**:
  1. 🍔 **Menu Items & Unit Economics Tracker**:
     - **Complete Menu Item Tracking**: Preloaded with authentic WOF Coimbatore items across Mains (Burgers, Pizzas, Wraps), Sides (Fries, Waffles), Drinks (Falooda, Soda), and Combos.
     - **Unit Economics Visibility**: Track Selling Price (₹), Production Cost (Food + Packaging) (₹), Gross Profit per portion (₹), Food Cost Percentage (%), Gross Margin Percentage (%), and Markup Multiplier (x).
     - **Food Cost Health Benchmarks**: Automatic color-coded badges comparing against industry standards:
       - 🟢 **Optimal** ($< 30\%$ Food Cost)
       - 🟡 **Moderate** ($30\% - 35\%$ Food Cost)
       - 🔴 **High Alert** ($> 35\%$ Food Cost)
     - **Quick Controls**: Filter by category (Mains, Sides, Drinks, Combos), filter by margin health, search by ingredient/name, sort by margin/price/cost, add custom menu items, and 1-click **Export Cost Sheet to CSV**.
  2. 🧮 **Food Cost Calculator & Recipe Manual Extractor**:
     - **WOF Standard Manual Integration**: Preloaded with 18 standardized recipes extracted directly from the WOF Hot Kitchen and Cold Station operational manuals.
     - **Automatic Recipe Puller**: Select any recipe (Classic French Fries, Peri Peri Chicken Wrap, Double Smash Burger, Cold Coffee, Royal Falooda) to instantly populate all raw materials, portion specs, and wholesale pack pricing.
     - **UoM (Unit of Measurement) Normalization**: Formulate portions in recipe units (`g`, `ml`, `pcs`, `tbsp`, `tsp`) against wholesale purchasing packages (`kg`, `g`, `L`, `ml`, `pcs`). The calculator automatically normalizes units to compute exact portion costs:
       $$\text{Portion Cost} = \left(\frac{\text{Wholesale Pack Price}}{\text{Pack Size in Base Units}}\right) \times \text{Recipe Portion in Base Units}$$
     - **Pasted Recipe Parser**: Paste any formulation text (e.g. `Fries (120g) + Salt (1g) + White Sauce (80g) + Cheese (40g)`) to auto-extract ingredients, quantities, and units.
     - **Hero Food Cost Display**: Real-time breakdown of raw materials, packaging, and kitchen shrinkage allowance (default $4\%$) with target food cost price suggester and 1-click save to menu tracker.
  3. 🎁 **Milestone Offers & Rewards Manager (CRUD)**:
     - **Dynamic Reward Engine**: Admins can **Create**, **Edit**, **Delete**, and **Toggle** milestone rewards that runners earn upon achieving game goals.
     - **Multi-Condition Triggers**:
       - 🎯 **Distance Run Milestones** (e.g. 1,000m awards Free Fries; 2,000m awards ₹50 off; 3,000m awards ₹100 off VIP feast)
       - ⭐ **Score Milestones** (e.g. 35,000 arcade combo points awards ₹75 off)
       - 📦 **Emergency Deliveries** (e.g. completing 2 delivery runs awards a Free Kovai Falooda Shake)
       - 🍔 **WOF Meal Combos** (e.g. completing 4 full meal sets awards 25% off wraps & burgers)
     - **Direct Game Integration**: When a player crashes, the game-over screen dynamically queries the active offers database, picks the highest unlocked tier, and creates unique formatted voucher codes (e.g. `WOF-FREEFRIES-8412`).
  4. 📊 **Food Cost % & Margin Analyzer**:
     - **What-If Sensitivity Simulator**: Interactive selling price ($₹30 - ₹600$) and food cost ($₹10 - ₹300$) sliders with a live visual **Rupee Breakdown Bar** showing where every ₹100 earned goes (Food Cost %, Kitchen Labor 28%, Store Rent & Utilities 18%, Net Operating Profit %).
     - **Supplier Inflation Impact**: Real-time projection of how $+10\%$ ingredient price surges affect margins and the exact menu price adjustment required to restore target profit.
     - **Inventory Period CoGS Calculator**: Restaurant accounting formula:
       $$\text{Food Cost } \% = \frac{\text{Beginning Inventory} + \text{Purchases} - \text{Ending Inventory}}{\text{Total Food Sales}} \times 100\%$$
     - **WOF Menu Engineering Matrix**: Interactive 2x2 Boston Consulting Group matrix sorting all menu items into ⭐ Stars, 🐎 Plowhorses, 🧩 Puzzles, and 🐶 Dogs.
  5. 📋 **Customer Leads & Coupon Redemptions**:
     - **Live Marketing KPIs**: Total player leads, total kilometers run, coupons issued, and redemption rates.
     - **WhatsApp Integration**: 1-click WhatsApp messaging pre-filled with customer coupon codes.
     - **Spreadsheet Sync**: 1-click CSV leads export and phone numbers copy for SMS campaigns.

---

### 9. Pure Procedural Web Audio API Synthesizer
- **100% Offline & Instant**: Zero external `.mp3` or `.wav` files needed!
- **Dynamic Arcade Track**: 128 BPM energetic electronic track with South Indian kuthu / street rhythm, syncopated bass, and arcade lead synths.
- **Rich SFX**: Pitched marimba pickups, fanfare chords, swoosh near-misses, crash thuds, and order alert chimes.
- Persistent Mute / Unmute toggle stored in `localStorage`.

---

## 📁 Project Structure

```text
d:\wof rush\
├── index.html         # Main game shell, responsive HUD, modals, touch controls & Stripe Admin Console
├── _worker.js         # Cloudflare Workers & Pages edge handler with REST API & KV persistence
├── wrangler.toml      # Wrangler configuration for Cloudflare Workers & Pages
├── _routes.json       # Cloudflare Pages route optimizer (routes /api/* to edge worker)
├── _headers           # Security headers, CORS headers, and asset caching rules
├── package.json       # Node & Cloudflare scripts (dev, deploy, start, test)
├── server.js          # Node.js backend server with REST APIs (/api/leads, /api/items, /api/offers, /api/recipes)
├── three.min.js       # Local Three.js r128 bundle (with CDN fallback)
├── data/
│   ├── items.json     # WOF Menu Items, recipe ingredients, portions, costs & prices
│   ├── leads.json     # Player leads, mobile numbers & coupon redemptions
│   ├── offers.json    # Dynamic milestone reward offers (Distance, Score, Deliveries, Meals)
│   └── recipes.json   # 18 Standard WOF Recipes extracted from Hot & Cold manual specifications
├── css/
│   └── style.css      # Stripe dashboard theme, sidebar, topbar, tables, offers badges & neon runner aesthetics
├── js/
│   ├── audio.js       # Procedural Web Audio API sound synthesizer & music engine
│   ├── models.js      # Procedural 3D Three.js models (Runner, Rickshaw, Food, Scenery)
│   ├── game.js        # Game engine, lane physics, chunk recycling, collisions, events
│   └── ui.js          # HUD tracking, dynamic milestone vouchers, recipe puller & offers CRUD
└── README.md          # Documentation & deployment guide
```

---

## ⚡ Cloudflare Workers & Pages Deployment

WOF RUSH is designed to run natively on the **Cloudflare Edge** as a high-performance **Cloudflare Pages** and **Cloudflare Workers** application with zero cold starts, global asset caching, and serverless REST APIs.

### Architecture Overview
- **Edge Routing (`_worker.js`)**: A universal V8 isolate worker handling `/api/leads`, `/api/items`, `/api/offers`, and `/api/recipes`, with seamless fallback to `env.ASSETS` for 3D game models, HTML, audio, and styles.
- **Route Optimization (`_routes.json`)**: Configured to route only `/api/*` requests to worker execution, allowing static game assets to bypass worker compute quotas and serve directly from Cloudflare's global CDN edge cache.
- **Security & Headers (`_headers`)**: Enforces CORS preflights, `X-Content-Type-Options`, `X-Frame-Options`, and aggressive immutable caching for `three.min.js` and assets.
- **Edge Persistence**: Dual-layer persistence:
  - **Cloudflare KV (`WOF_KV`)**: Global persistent storage across all Cloudflare edge regions.
  - **Zero-Config Fallback**: Automatic in-memory and static asset seeding if KV is not yet bound.

---

### Option 1: Deploy with Cloudflare Pages (Git Integration - Recommended)

1. **Push to GitHub**:
   Ensure your code is pushed to your GitHub repository:
   ```bash
   git push origin main
   ```
2. **Connect to Cloudflare Pages**:
   - Go to the **Cloudflare Dashboard** → **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
   - Select your repository: `https://github.com/abhijithsairaj/wofadmin`.
3. **Build Settings**:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `.`
4. **Deploy**:
   - Click **Save and Deploy**. Cloudflare Pages will automatically detect `_worker.js`, `_routes.json`, and static assets, deploying your app in seconds!

---

### Option 2: Deploy via Wrangler CLI

#### Deploy to Cloudflare Pages:
```powershell
# Authenticate with Cloudflare
npx wrangler login

# Deploy directly to Cloudflare Pages
npm run deploy:pages
# or: npx wrangler pages deploy .
```

#### Deploy to Cloudflare Workers (Static Assets):
```powershell
# Deploy as a Cloudflare Worker with Static Assets
npm run deploy:worker
# or: npx wrangler deploy
```

---

### Option 3: Optional Cloudflare KV Edge Persistence

To persist changes to Menu Items, Milestone Offers, and Customer Leads across multiple regions forever:

1. **Create a KV Namespace**:
   ```powershell
   npx wrangler kv:namespace create WOF_KV
   ```
2. **Add Binding to `wrangler.toml`**:
   Uncomment and paste the generated namespace ID in `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "WOF_KV"
   id = "<YOUR_GENERATED_KV_ID>"
   ```
3. For Cloudflare Pages via Dashboard:
   - Go to **Project Settings** → **Functions** → **KV namespace bindings**.
   - Bind variable name `WOF_KV` to your created KV namespace.

---

## 🚀 Running Locally

### Option A: Local Cloudflare Edge Preview (Wrangler)
```powershell
npm run dev
# or: npx wrangler pages dev .
```

### Option B: Local Node.js Server
```powershell
npm start
# or: node server.js
```
Then visit: `http://localhost:8080` (or the port assigned by Wrangler).

---

## 🌐 Marketing Campaign Deployment

To deploy WOF RUSH for real-world marketing (QR codes on takeaway bags, table stands, menu flyers, Instagram bio):

1. **Deploy to Cloudflare**:
   Deploy using the steps above to get your custom domain (e.g. `https://wofadmin.pages.dev` or `https://rush.woffoods.in`).
2. **Generate QR Codes**:
   - Print QR codes pointing to your live URL on:
     - Burger packaging & fry boxes
     - Delivery takeaway bags
     - Table tents at the Selvapuram outlet
     - Receipts with *"Beat Today's Score to win Free Fries!"*
3. **Local Store Challenge**:
   - Customers showing verified voucher codes with phone numbers at the counter claim immediate discounts or free items.
