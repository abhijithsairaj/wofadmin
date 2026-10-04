const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data', 'leads.json');
const ITEMS_FILE = path.join(__dirname, 'data', 'items.json');
const OFFERS_FILE = path.join(__dirname, 'data', 'offers.json');
const RECIPES_FILE = path.join(__dirname, 'data', 'recipes.json');

// Ensure data file exists with default demo entries if empty
if (!fs.existsSync(DATA_FILE)) {
  const initialLeads = [
    {
      id: 'L-1001',
      name: 'Arun Kumar',
      phone: '9842156789',
      score: 48920,
      distance: 2450,
      meals: 6,
      deliveries: 3,
      couponCode: 'WOFRUSH-100-8412',
      couponTitle: 'WOF VIP FEAST VOUCHER',
      couponDiscount: '₹100 OFF on orders above ₹499',
      redeemed: false,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'L-1002',
      name: 'Karthi Keyan',
      phone: '9789123450',
      score: 46210,
      distance: 2180,
      meals: 5,
      deliveries: 2,
      couponCode: 'WOF-MEAL-50-6190',
      couponTitle: 'WOF CRAVE VOUCHER',
      couponDiscount: '₹50 OFF on orders above ₹299',
      redeemed: true,
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'L-1003',
      name: 'Priya Sundaram',
      phone: '9944567812',
      score: 43880,
      distance: 1850,
      meals: 4,
      deliveries: 2,
      couponCode: 'WOF-MEAL-50-3321',
      couponTitle: 'WOF CRAVE VOUCHER',
      couponDiscount: '₹50 OFF on orders above ₹299',
      redeemed: false,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'L-1004',
      name: 'Vignesh R',
      phone: '9443128901',
      score: 28400,
      distance: 1250,
      meals: 3,
      deliveries: 1,
      couponCode: 'WOF-FREEFRIES-9021',
      couponTitle: 'WOF CRISPY REWARD',
      couponDiscount: 'FREE FRIES with any burger meal',
      redeemed: false,
      timestamp: new Date(Date.now() - 3600000 * 30).toISOString()
    },
    {
      id: 'L-1005',
      name: 'Deepa M',
      phone: '9655234109',
      score: 14200,
      distance: 780,
      meals: 1,
      deliveries: 0,
      couponCode: null,
      couponTitle: 'None (< 1,000m)',
      couponDiscount: 'Reached 780m (Goal: 1,000m)',
      redeemed: false,
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialLeads, null, 2), 'utf8');
}

function readLeads() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeLeads(leads) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function readItems() {
  try {
    if (!fs.existsSync(ITEMS_FILE)) return [];
    const raw = fs.readFileSync(ITEMS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeItems(items) {
  try {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function readOffers() {
  try {
    if (!fs.existsSync(OFFERS_FILE)) return [];
    const raw = fs.readFileSync(OFFERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeOffers(offers) {
  try {
    fs.writeFileSync(OFFERS_FILE, JSON.stringify(offers, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function readRecipes() {
  try {
    if (!fs.existsSync(RECIPES_FILE)) return [];
    const raw = fs.readFileSync(RECIPES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTE: GET /api/leads ---
  if (req.method === 'GET' && pathname === '/api/leads') {
    const leads = readLeads();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, leads }));
    return;
  }

  // --- API ROUTE: POST /api/leads ---
  if (req.method === 'POST' && pathname === '/api/leads') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.phone || !data.name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Name and Phone number are required' }));
          return;
        }

        const leads = readLeads();
        const newLead = {
          id: 'L-' + (Date.now().toString().slice(-6)),
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

        // Insert at beginning
        leads.unshift(newLead);
        writeLeads(leads);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, lead: newLead }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // --- API ROUTE: POST /api/leads/toggle-redeem ---
  if (req.method === 'POST' && pathname === '/api/leads/toggle-redeem') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const leads = readLeads();
        const found = leads.find(l => l.id === data.id);
        if (found) {
          found.redeemed = !found.redeemed;
          writeLeads(leads);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, lead: found }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Lead not found' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // --- API ROUTE: DELETE /api/leads ---
  if (req.method === 'DELETE' && pathname === '/api/leads') {
    writeLeads([]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'All leads cleared' }));
    return;
  }

  // --- API ROUTE: GET /api/items ---
  if (req.method === 'GET' && pathname === '/api/items') {
    const items = readItems();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, items }));
    return;
  }

  // --- API ROUTE: POST /api/items ---
  if (req.method === 'POST' && pathname === '/api/items') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const itemData = JSON.parse(body);
        if (!itemData.name || itemData.price === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Item name and price are required' }));
          return;
        }

        const items = readItems();
        let targetId = itemData.id;
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

        if (existingIdx >= 0) {
          items[existingIdx] = sanitizedItem;
        } else {
          items.push(sanitizedItem);
        }

        writeItems(items);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item: sanitizedItem }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // --- API ROUTE: DELETE /api/items ---
  if (req.method === 'DELETE' && pathname === '/api/items') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        let itemId = parsedUrl.searchParams.get('id');
        if (!itemId && body) {
          try { itemId = JSON.parse(body).id; } catch(e) {}
        }
        if (!itemId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Item ID is required' }));
          return;
        }

        let items = readItems();
        const initialCount = items.length;
        items = items.filter(it => it.id !== itemId);
        writeItems(items);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, deleted: initialCount > items.length, items }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // --- API ROUTE: GET /api/offers ---
  if (req.method === 'GET' && pathname === '/api/offers') {
    const offers = readOffers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, offers }));
    return;
  }

  // --- API ROUTE: POST /api/offers ---
  if (req.method === 'POST' && pathname === '/api/offers') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const offerData = JSON.parse(body);
        if (!offerData.title || offerData.threshold === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Title and threshold are required' }));
          return;
        }

        const offers = readOffers();
        let targetId = offerData.id;
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

        if (existingIdx >= 0) {
          offers[existingIdx] = sanitizedOffer;
        } else {
          offers.push(sanitizedOffer);
        }

        writeOffers(offers);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, offer: sanitizedOffer, offers }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // --- API ROUTE: DELETE /api/offers ---
  if (req.method === 'DELETE' && pathname === '/api/offers') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        let offerId = parsedUrl.searchParams.get('id');
        if (!offerId && body) {
          try { offerId = JSON.parse(body).id; } catch(e) {}
        }
        if (!offerId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Offer ID is required' }));
          return;
        }

        let offers = readOffers();
        const initialCount = offers.length;
        offers = offers.filter(o => o.id !== offerId);
        writeOffers(offers);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, deleted: initialCount > offers.length, offers }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // --- API ROUTE: GET /api/recipes ---
  if (req.method === 'GET' && pathname === '/api/recipes') {
    const recipes = readRecipes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, recipes }));
    return;
  }

  // --- STATIC FILE SERVING ---
  let reqUrl = pathname;
  if (reqUrl === '/') reqUrl = '/index.html';

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🍔 WOF RUSH server running at: http://localhost:${PORT}/`);
  console.log(`🔑 Admin Console available in-game and at http://localhost:${PORT}/#admin`);
});
