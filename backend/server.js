/**
 * NearU Backend API
 * Node.js pure (no npm packages required)
 * Port: 3000
 *
 * Endpoints:
 *  POST /api/auth/signup
 *  POST /api/auth/login
 *  GET  /api/auth/me
 *  GET  /api/properties
 *  GET  /api/properties/:id
 *  POST /api/properties          (landlord)
 *  PUT  /api/properties/:id      (landlord owner)
 *  DELETE /api/properties/:id    (landlord owner)
 *  GET  /api/properties/featured
 *  POST /api/inquiries
 *  GET  /api/inquiries           (landlord)
 *  GET  /api/health
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { load, save, hashPassword, verifyPassword } = require('./db');
const { createToken, verify, getBearer } = require('./auth');

const PORT = process.env.PORT || 3000;

// ---------- helpers ----------
function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function requireAuth(req) {
  const token = getBearer(req);
  const payload = verify(token);
  if (!payload) return null;
  return payload;
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || null,
    verified: !!u.verified,
    createdAt: u.createdAt
  };
}

function enrichProperty(p, db) {
  const landlord = db.users.find((u) => u.id === p.landlordId);
  return {
    ...p,
    landlord: landlord
      ? {
          id: landlord.id,
          name: landlord.name,
          verified: landlord.verified,
          phone: landlord.phone
        }
      : null
  };
}

// ---------- routes ----------
async function handle(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/$/, '') || '/';
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // Health
    if (method === 'GET' && pathname === '/api/health') {
      return send(res, 200, { ok: true, service: 'NearU API', time: new Date().toISOString() });
    }

    // ---------- AUTH ----------
    if (method === 'POST' && pathname === '/api/auth/signup') {
      const body = await parseBody(req);
      const { name, email, password, role, phone } = body;
      if (!name || !email || !password) {
        return send(res, 400, { error: 'name, email, password are required' });
      }
      if (password.length < 6) {
        return send(res, 400, { error: 'Password must be at least 6 characters' });
      }
      const db = load();
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return send(res, 409, { error: 'Email already registered' });
      }
      const user = {
        id: db.nextIds.user++,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: hashPassword(password),
        role: role === 'landlord' ? 'landlord' : 'student',
        phone: phone || null,
        verified: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      save(db);
      const token = createToken(user);
      return send(res, 201, { message: 'Account created', token, user: publicUser(user) });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await parseBody(req);
      const { email, password } = body;
      if (!email || !password) {
        return send(res, 400, { error: 'email and password are required' });
      }
      const db = load();
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || !verifyPassword(password, user.password)) {
        return send(res, 401, { error: 'Invalid email or password' });
      }
      const token = createToken(user);
      return send(res, 200, { message: 'Login successful', token, user: publicUser(user) });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      const auth = requireAuth(req);
      if (!auth) return send(res, 401, { error: 'Unauthorized' });
      const db = load();
      const user = db.users.find((u) => u.id === auth.id);
      if (!user) return send(res, 401, { error: 'User not found' });
      return send(res, 200, { user: publicUser(user) });
    }

    // ---------- PROPERTIES ----------
    if (method === 'GET' && pathname === '/api/properties/featured') {
      const db = load();
      const list = db.properties
        .filter((p) => p.status === 'active' && p.featured)
        .map((p) => enrichProperty(p, db));
      return send(res, 200, { count: list.length, properties: list });
    }

    if (method === 'GET' && pathname === '/api/properties') {
      const db = load();
      let list = db.properties.filter((p) => p.status === 'active');

      const q = parsed.query;
      // location / university search
      if (q.location) {
        const term = String(q.location).toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            p.location.toLowerCase().includes(term) ||
            (p.university && p.university.toLowerCase().includes(term))
        );
      }
      if (q.university) {
        const term = String(q.university).toLowerCase();
        list = list.filter((p) => p.university && p.university.toLowerCase().includes(term));
      }
      if (q.maxPrice) {
        const max = Number(q.maxPrice);
        if (!isNaN(max) && max > 0) list = list.filter((p) => p.price <= max);
      }
      if (q.minPrice) {
        const min = Number(q.minPrice);
        if (!isNaN(min)) list = list.filter((p) => p.price >= min);
      }
      if (q.type && q.type !== 'Any') {
        const types = String(q.type)
          .split(',')
          .map((type) => type.trim().toLowerCase())
          .filter(Boolean);
        list = list.filter((p) =>
          types.some((type) => p.type.toLowerCase().includes(type))
        );
      }
      if (q.maxDistance) {
        const d = Number(q.maxDistance);
        if (!isNaN(d)) list = list.filter((p) => p.distance <= d);
      }
      if (q.amenity) {
        const ams = String(q.amenity)
          .split(',')
          .map((a) => a.trim().toLowerCase())
          .filter(Boolean);
        if (ams.length) {
          list = list.filter((p) =>
            ams.every((a) => p.amenities.some((x) => x.toLowerCase().includes(a)))
          );
        }
      }

      // sort
      if (q.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
      else if (q.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
      else if (q.sort === 'distance') list.sort((a, b) => a.distance - b.distance);
      else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // pagination
      const page = Math.max(1, Number(q.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(q.limit) || 12));
      const total = list.length;
      const start = (page - 1) * limit;
      const pageItems = list.slice(start, start + limit).map((p) => enrichProperty(p, db));

      return send(res, 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        properties: pageItems
      });
    }

    // GET one property
    const propMatch = pathname.match(/^\/api\/properties\/(\d+)$/);
    if (method === 'GET' && propMatch) {
      const id = Number(propMatch[1]);
      const db = load();
      const p = db.properties.find((x) => x.id === id);
      if (!p) return send(res, 404, { error: 'Property not found' });
      return send(res, 200, { property: enrichProperty(p, db) });
    }

    // CREATE property (landlord)
    if (method === 'POST' && pathname === '/api/properties') {
      const auth = requireAuth(req);
      if (!auth) return send(res, 401, { error: 'Login required' });
      if (auth.role !== 'landlord') {
        return send(res, 403, { error: 'Only landlords can list properties' });
      }
      const body = await parseBody(req);
      const { title, price, location, university, distance, type, amenities, description, image, lat, lng } = body;
      if (!title || price == null || !location || !type) {
        return send(res, 400, { error: 'title, price, location, type are required' });
      }
      const db = load();
      const prop = {
        id: db.nextIds.property++,
        title: String(title).trim(),
        price: Number(price),
        location: String(location).trim(),
        university: university || null,
        distance: distance != null ? Number(distance) : 1,
        type: String(type),
        amenities: Array.isArray(amenities) ? amenities : [],
        description: description || '',
        image: image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
        lat: lat != null ? Number(lat) : 11.5564,
        lng: lng != null ? Number(lng) : 104.9282,
        featured: false,
        status: 'active',
        verified: false,
        landlordId: auth.id,
        createdAt: new Date().toISOString()
      };
      db.properties.push(prop);
      save(db);
      return send(res, 201, { message: 'Property listed', property: enrichProperty(prop, db) });
    }

    // UPDATE property
    if (method === 'PUT' && propMatch) {
      const auth = requireAuth(req);
      if (!auth) return send(res, 401, { error: 'Login required' });
      const id = Number(propMatch[1]);
      const db = load();
      const idx = db.properties.findIndex((x) => x.id === id);
      if (idx === -1) return send(res, 404, { error: 'Property not found' });
      if (db.properties[idx].landlordId !== auth.id) {
        return send(res, 403, { error: 'Not your property' });
      }
      const body = await parseBody(req);
      const allowed = ['title', 'price', 'location', 'university', 'distance', 'type', 'amenities', 'description', 'image', 'lat', 'lng', 'status'];
      allowed.forEach((k) => {
        if (body[k] !== undefined) db.properties[idx][k] = body[k];
      });
      db.properties[idx].updatedAt = new Date().toISOString();
      save(db);
      return send(res, 200, { message: 'Updated', property: enrichProperty(db.properties[idx], db) });
    }

    // DELETE property
    if (method === 'DELETE' && propMatch) {
      const auth = requireAuth(req);
      if (!auth) return send(res, 401, { error: 'Login required' });
      const id = Number(propMatch[1]);
      const db = load();
      const idx = db.properties.findIndex((x) => x.id === id);
      if (idx === -1) return send(res, 404, { error: 'Property not found' });
      if (db.properties[idx].landlordId !== auth.id) {
        return send(res, 403, { error: 'Not your property' });
      }
      db.properties.splice(idx, 1);
      save(db);
      return send(res, 200, { message: 'Property deleted' });
    }

    // ---------- INQUIRIES ----------
    if (method === 'POST' && pathname === '/api/inquiries') {
      const body = await parseBody(req);
      const { propertyId, name, email, phone, message } = body;
      if (!propertyId || !name || !message) {
        return send(res, 400, { error: 'propertyId, name, message are required' });
      }
      const db = load();
      const prop = db.properties.find((p) => p.id === Number(propertyId));
      if (!prop) return send(res, 404, { error: 'Property not found' });
      const inquiry = {
        id: db.nextIds.inquiry++,
        propertyId: prop.id,
        landlordId: prop.landlordId,
        name: String(name).trim(),
        email: email || null,
        phone: phone || null,
        message: String(message).trim(),
        status: 'new',
        createdAt: new Date().toISOString()
      };
      db.inquiries.push(inquiry);
      save(db);
      return send(res, 201, { message: 'Inquiry sent to landlord', inquiry });
    }

    if (method === 'GET' && pathname === '/api/inquiries') {
      const auth = requireAuth(req);
      if (!auth) return send(res, 401, { error: 'Login required' });
      const db = load();
      const list = db.inquiries
        .filter((i) => i.landlordId === auth.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return send(res, 200, { count: list.length, inquiries: list });
    }

    // ---------- static frontend (optional) ----------
    if (method === 'GET' && (pathname === '/' || pathname.endsWith('.html') || pathname.startsWith('/image'))) {
      // serve nothing special — API only
    }

    return send(res, 404, { error: 'Not found', path: pathname });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: err.message || 'Server error' });
  }
}

const server = http.createServer(handle);

server.listen(PORT, () => {
  // force seed on first start
  load();
  console.log('');
  console.log('  🏠 NearU Backend API running');
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('  Demo accounts (password: password123)');
  console.log('    student@nearu.com  (student)');
  console.log('    sokha@nearu.com    (landlord)');
  console.log('    dara@nearu.com     (landlord)');
  console.log('');
});
