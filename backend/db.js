/**
 * NearU Database Layer (JSON file store)
 * ប្រើ JSON file ជាឃ្លាំងទិន្នន័យ — មិនត្រូវការ MongoDB ឬ PostgreSQL
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'nearu.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultData() {
  return {
    users: [],
    properties: [],
    inquiries: [],
    nextIds: { user: 1, property: 1, inquiry: 1 }
  };
}

function load() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    const data = defaultData();
    seed(data);
    save(data);
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

function seed(data) {
  // Demo users (password for all: password123)
  const demoPass = hashPassword('password123');

  data.users.push(
    {
      id: data.nextIds.user++,
      name: 'Sokha Lim',
      email: 'sokha@nearu.com',
      password: demoPass,
      role: 'landlord',
      phone: '+855 12 345 678',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: data.nextIds.user++,
      name: 'Dara Phan',
      email: 'dara@nearu.com',
      password: demoPass,
      role: 'landlord',
      phone: '+855 98 765 432',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: data.nextIds.user++,
      name: 'Student Demo',
      email: 'student@nearu.com',
      password: demoPass,
      role: 'student',
      phone: '+855 11 222 333',
      verified: true,
      createdAt: new Date().toISOString()
    }
  );

  const sampleProperties = [
    {
      title: 'Modern Private Room near RUPP',
      price: 120,
      location: 'Toul Kork, Phnom Penh',
      university: 'RUPP',
      distance: 0.8,
      type: 'Private Room',
      amenities: ['Wi-Fi', 'Air Conditioner', 'Private Bathroom'],
      description: 'A comfortable, modern private room in a convenient student neighborhood near RUPP.',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
      lat: 11.568,
      lng: 104.921,
      featured: true,
      landlordId: 1
    },
    {
      title: 'Cozy Studio near RULE',
      price: 150,
      location: 'Boeung Keng Kang, Phnom Penh',
      university: 'RULE',
      distance: 1.2,
      type: 'Apartment',
      amenities: ['Wi-Fi', 'Air Conditioner', 'Kitchen'],
      description: 'A cozy studio with practical layout near RULE, cafes and shops.',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop',
      lat: 11.555,
      lng: 104.915,
      featured: true,
      landlordId: 2
    },
    {
      title: 'Luxury Room with Balcony – PUC',
      price: 180,
      location: 'Mao Tse Toung Blvd, Phnom Penh',
      university: 'PUC',
      distance: 1.0,
      type: 'Private Room',
      amenities: ['Wi-Fi', 'Air Conditioner', 'Private Bathroom', 'Balcony'],
      description: 'Bright room with private balcony, close to PUC and transport.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      lat: 11.55,
      lng: 104.91,
      featured: true,
      landlordId: 1
    },
    {
      title: 'Private Room near RUPP',
      price: 90,
      location: 'Phnom Penh',
      university: 'RUPP',
      distance: 0.5,
      type: 'Private Room',
      amenities: ['Wi-Fi', 'Private Bathroom'],
      description: 'Affordable private room close to RUPP.',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop',
      lat: 11.565,
      lng: 104.895,
      featured: false,
      landlordId: 1
    },
    {
      title: 'Cozy Studio near RULE',
      price: 160,
      location: 'Phnom Penh',
      university: 'RULE',
      distance: 0.7,
      type: 'Apartment',
      amenities: ['Wi-Fi', 'Air Conditioner', 'Kitchen'],
      description: 'Furnished studio near RULE.',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop',
      lat: 11.56,
      lng: 104.915,
      featured: false,
      landlordId: 2
    },
    {
      title: 'Shared House near NUM',
      price: 120,
      location: 'Phnom Penh',
      university: 'NUM',
      distance: 1.0,
      type: 'House',
      amenities: ['Wi-Fi', 'Kitchen'],
      description: 'Shared house near National University of Management.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
      lat: 11.545,
      lng: 104.935,
      featured: false,
      landlordId: 2
    },
    {
      title: 'Private Room near ITC',
      price: 85,
      location: 'Phnom Penh',
      university: 'ITC',
      distance: 0.6,
      type: 'Private Room',
      amenities: ['Wi-Fi', 'Private Bathroom'],
      description: 'Affordable room near Institute of Technology of Cambodia.',
      image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=500&fit=crop',
      lat: 11.568,
      lng: 104.89,
      featured: false,
      landlordId: 1
    },
    {
      title: 'Modern Studio near AEON',
      price: 200,
      location: 'Phnom Penh',
      university: 'AEON',
      distance: 1.2,
      type: 'Apartment',
      amenities: ['Wi-Fi', 'Air Conditioner', 'Kitchen'],
      description: 'Modern studio near AEON Mall.',
      image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=500&fit=crop',
      lat: 11.55,
      lng: 104.94,
      featured: true,
      landlordId: 2
    },
    {
      title: 'House Room near BBU',
      price: 110,
      location: 'Phnom Penh',
      university: 'BBU',
      distance: 1.5,
      type: 'House',
      amenities: ['Wi-Fi', 'Private Bathroom'],
      description: 'Private room in house near Build Bright University.',
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=500&fit=crop',
      lat: 11.542,
      lng: 104.92,
      featured: false,
      landlordId: 1
    }
  ];

  sampleProperties.forEach((p) => {
    data.properties.push({
      id: data.nextIds.property++,
      ...p,
      status: 'active',
      verified: true,
      createdAt: new Date().toISOString()
    });
  });
}

module.exports = {
  load,
  save,
  hashPassword,
  verifyPassword
};
