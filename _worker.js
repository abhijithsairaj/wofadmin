/**
 * WOF RUSH - Universal Cloudflare Workers & Pages Edge Worker
 * 
 * Supports:
 *  - Cloudflare Pages (Advanced Mode)
 *  - Cloudflare Workers (Static Assets)
 *  - Cloudflare KV edge persistence (Namespace: WOF_KV or KV)
 *  - In-memory & Static Asset auto-seeding fallback
 *  - Full REST API for Leads, Items, Offers, and Recipe Costing
 */

// In-memory cache for edge isolate lifetime (used when KV is not bound or as L1 cache)
const memoryStore = {
  leads: null,
  items: null,
  offers: null,
  recipes: null
};

// Initial fallback leads if not found in KV or assets
const DEFAULT_LEADS = [
  {
    id: "L-1001",
    name: "Arun Kumar",
    phone: "9842156789",
    score: 48920,
    distance: 2450,
    meals: 6,
    deliveries: 3,
    couponCode: "WOFRUSH-100-8412",
    couponTitle: "WOF VIP FEAST VOUCHER",
    couponDiscount: "₹100 OFF on orders above ₹499",
    redeemed: false,
    timestamp: "2026-10-04T10:00:00.000Z"
  },
  {
    id: "L-1002",
    name: "Karthi Keyan",
    phone: "9789123450",
    score: 46210,
    distance: 2180,
    meals: 5,
    deliveries: 2,
    couponCode: "WOF-MEAL-50-6190",
    couponTitle: "WOF CRAVE VOUCHER",
    couponDiscount: "₹50 OFF on orders above ₹299",
    redeemed: true,
    timestamp: "2026-10-04T08:30:00.000Z"
  },
  {
    id: "L-1003",
    name: "Priya Sundaram",
    phone: "9944567812",
    score: 43880,
    distance: 1850,
    meals: 4,
    deliveries: 2,
    couponCode: "WOF-MEAL-50-3321",
    couponTitle: "WOF CRAVE VOUCHER",
    couponDiscount: "₹50 OFF on orders above ₹299",
    redeemed: false,
    timestamp: "2026-10-03T18:15:00.000Z"
  }
];

// Helper: standard CORS headers
function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extra
  };
}

// Helper: JSON response with CORS & cache headers
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...corsHeaders(extraHeaders)
    }
  });
}

// Helper: Get KV instance if bound
function getKV(env) {
  if (!env) return null;
  return env.WOF_KV || env.KV || env.wof_kv || null;
}

// Generic Data Reader: checks KV -> Memory -> Static Asset -> Embedded Fallback
async function loadData(env, request, key, assetPath, fallbackData = []) {
  const kv = getKV(env);

  // 1. Try reading from Cloudflare KV
  if (kv) {
    try {
      const kvVal = await kv.get(key, 'json');
      if (kvVal !== null && kvVal !== undefined) {
        memoryStore[key] = kvVal;
        return kvVal;
      }
    } catch (err) {
      console.warn(`[KV Read Error: ${key}]`, err);
    }
  }

  // 2. Try in-memory store
  if (memoryStore[key] !== null && memoryStore[key] !== undefined) {
    return memoryStore[key];
  }

  // 3. Try reading from static assets
  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    try {
      const assetUrl = new URL(assetPath, request.url);
      const assetRes = await env.ASSETS.fetch(new Request(assetUrl));
      if (assetRes.ok) {
        const parsed = await assetRes.json();
        memoryStore[key] = parsed;
        if (kv) {
          try { await kv.put(key, JSON.stringify(parsed)); } catch (_) {}
        }
        return parsed;
      }
    } catch (err) {
      console.warn(`[Asset Fetch Fallback: ${assetPath}]`, err);
    }
  }

  // 4. Return embedded fallback
  memoryStore[key] = fallbackData;
  if (kv) {
    try { await kv.put(key, JSON.stringify(fallbackData)); } catch (_) {}
  }
  return fallbackData;
}

// Generic Data Writer: writes to Memory and KV
async function saveData(env, key, data) {
  memoryStore[key] = data;
  const kv = getKV(env);
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error(`[KV Write Error: ${key}]`, err);
      return false;
    }
  }
  return true;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS preflight OPTIONS
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // --- API ROUTE: /api/leads ---
    if (pathname === '/api/leads') {
      if (method === 'GET') {
        const leads = await loadData(env, request, 'leads', '/data/leads.json', DEFAULT_LEADS);
        return jsonResponse({ success: true, leads });
      }

      if (method === 'POST') {
        try {
          const data = await request.json();
          if (!data.phone || !data.name) {
            return jsonResponse({ success: false, error: 'Name and Phone number are required' }, 400);
          }

          const leads = await loadData(env, request, 'leads', '/data/leads.json', DEFAULT_LEADS);
          const newLead = {
            id: 'L-' + Date.now().toString().slice(-6),
            name: String(data.name).trim().slice(0, 40),
            phone: String(data.phone).trim().replace(/[^\d]/g, '').slice(0, 15),
            score: Number(data.score) || 0,
            distance: Number(data.distance) || 0,
            meals: Number(data.meals) || 0,
            deliveries: Number(data.deliveries) || 0,
            couponCode: data.couponCode || null,
            couponTitle: data.couponTitle || (data.distance >= 1000 ? 'WOF Voucher' : 'None (< 1,000m)'),
            couponDiscount: data.couponDiscount || (data.distance >= 1000 ? '' : 'Did not reach 1,000m'),
            redeemed: false,
            timestamp: new Date().toISOString()
          };

          const updated = [newLead, ...leads];
          await saveData(env, 'leads', updated);
          return jsonResponse({ success: true, lead: newLead });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
        }
      }

      if (method === 'DELETE') {
        await saveData(env, 'leads', []);
        return jsonResponse({ success: true, message: 'All leads cleared' });
      }
    }

    // --- API ROUTE: /api/leads/toggle-redeem ---
    if (pathname === '/api/leads/toggle-redeem' && method === 'POST') {
      try {
        const data = await request.json();
        const leads = await loadData(env, request, 'leads', '/data/leads.json', DEFAULT_LEADS);
        const found = leads.find(l => l.id === data.id);
        if (found) {
          found.redeemed = !found.redeemed;
          await saveData(env, 'leads', leads);
          return jsonResponse({ success: true, lead: found });
        } else {
          return jsonResponse({ success: false, error: 'Lead not found' }, 404);
        }
      } catch (err) {
        return jsonResponse({ success: false, error: 'Invalid request' }, 400);
      }
    }

    // --- API ROUTE: /api/items ---
    if (pathname === '/api/items') {
      if (method === 'GET') {
        const items = await loadData(env, request, 'items', '/data/items.json', []);
        return jsonResponse({ success: true, items });
      }

      if (method === 'POST') {
        try {
          const itemData = await request.json();
          if (!itemData.name || itemData.price === undefined) {
            return jsonResponse({ success: false, error: 'Item name and price are required' }, 400);
          }

          const items = await loadData(env, request, 'items', '/data/items.json', []);
          const targetId = itemData.id;
          const existingIdx = targetId ? items.findIndex(it => it.id === targetId) : -1;

          const sanitizedItem = {
            id: targetId || ('item-' + Date.now().toString().slice(-6)),
            name: String(itemData.name).trim().slice(0, 50),
            category: ['main', 'side', 'drink', 'combo'].includes(itemData.category) ? itemData.category : 'main',
            icon: itemData.icon || (itemData.category === 'drink' ? '🥤' : (itemData.category === 'side' ? '🍟' : (itemData.category === 'combo' ? '🎁' : '🍔'))),
            price: Math.max(0, Number(itemData.price) || 0),
            cost: Math.max(0, Number(itemData.cost) || 0),
            foodCost: Math.max(0, Number(itemData.foodCost) || 0),
            packagingCost: Math.max(0, Number(itemData.packagingCost) || 0),
            portion: itemData.portion ? String(itemData.portion).trim().slice(0, 40) : '1 serving',
            popularity: Number(itemData.popularity) || 500,
            targetFoodCostPct: Number(itemData.targetFoodCostPct) || 30,
            ingredients: Array.isArray(itemData.ingredients) ? itemData.ingredients : [],
            updatedAt: new Date().toISOString()
          };

          let updated;
          if (existingIdx >= 0) {
            updated = [...items];
            updated[existingIdx] = sanitizedItem;
          } else {
            updated = [...items, sanitizedItem];
          }

          await saveData(env, 'items', updated);
          return jsonResponse({ success: true, item: sanitizedItem });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
        }
      }

      if (method === 'DELETE') {
        try {
          let itemId = url.searchParams.get('id');
          if (!itemId) {
            try {
              const body = await request.json();
              itemId = body.id;
            } catch (_) {}
          }

          if (!itemId) {
            return jsonResponse({ success: false, error: 'Item ID is required' }, 400);
          }

          const items = await loadData(env, request, 'items', '/data/items.json', []);
          const initialCount = items.length;
          const filtered = items.filter(it => it.id !== itemId);
          await saveData(env, 'items', filtered);

          return jsonResponse({
            success: true,
            deleted: initialCount > filtered.length,
            items: filtered
          });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Invalid request' }, 400);
        }
      }
    }

    // --- API ROUTE: /api/offers ---
    if (pathname === '/api/offers') {
      if (method === 'GET') {
        const offers = await loadData(env, request, 'offers', '/data/offers.json', []);
        return jsonResponse({ success: true, offers });
      }

      if (method === 'POST') {
        try {
          const offerData = await request.json();
          if (!offerData.title || offerData.threshold === undefined) {
            return jsonResponse({ success: false, error: 'Title and threshold are required' }, 400);
          }

          const offers = await loadData(env, request, 'offers', '/data/offers.json', []);
          const targetId = offerData.id;
          const existingIdx = targetId ? offers.findIndex(o => o.id === targetId) : -1;

          const sanitizedOffer = {
            id: targetId || ('off-' + Date.now().toString().slice(-6)),
            title: String(offerData.title).trim().slice(0, 60),
            conditionType: ['distance', 'score', 'meals', 'deliveries'].includes(offerData.conditionType) ? offerData.conditionType : 'distance',
            threshold: Math.max(1, Number(offerData.threshold) || 1000),
            reward: String(offerData.reward || '').trim().slice(0, 100),
            codePrefix: String(offerData.codePrefix || 'WOF-OFFER').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20),
            minOrder: Math.max(0, Number(offerData.minOrder) || 0),
            active: offerData.active !== undefined ? Boolean(offerData.active) : true,
            description: offerData.description ? String(offerData.description).trim().slice(0, 150) : '',
            updatedAt: new Date().toISOString()
          };

          let updated;
          if (existingIdx >= 0) {
            updated = [...offers];
            updated[existingIdx] = sanitizedOffer;
          } else {
            updated = [...offers, sanitizedOffer];
          }

          await saveData(env, 'offers', updated);
          return jsonResponse({ success: true, offer: sanitizedOffer, offers: updated });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
        }
      }

      if (method === 'DELETE') {
        try {
          let offerId = url.searchParams.get('id');
          if (!offerId) {
            try {
              const body = await request.json();
              offerId = body.id;
            } catch (_) {}
          }

          if (!offerId) {
            return jsonResponse({ success: false, error: 'Offer ID is required' }, 400);
          }

          const offers = await loadData(env, request, 'offers', '/data/offers.json', []);
          const initialCount = offers.length;
          const filtered = offers.filter(o => o.id !== offerId);
          await saveData(env, 'offers', filtered);

          return jsonResponse({
            success: true,
            deleted: initialCount > filtered.length,
            offers: filtered
          });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Invalid request' }, 400);
        }
      }
    }

    // --- API ROUTE: /api/recipes ---
    if (pathname === '/api/recipes' && method === 'GET') {
      const recipes = await loadData(env, request, 'recipes', '/data/recipes.json', []);
      return jsonResponse({ success: true, recipes });
    }

    // --- STATIC ASSET SERVING VIA env.ASSETS (Cloudflare Pages & Workers Static Assets) ---
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      let assetRequest = request;
      if (pathname === '/') {
        assetRequest = new Request(new URL('/index.html', request.url), request);
      }
      return env.ASSETS.fetch(assetRequest);
    }

    // Fallback if env.ASSETS is somehow unavailable
    return new Response('WOF RUSH - Asset Not Found', { status: 404 });
  }
};
