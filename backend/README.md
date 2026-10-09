# NearU Backend API

Backend សម្រាប់គេហទំព័រ **NearU** (Student Rentals នៅកម្ពុជា)

## របៀបដំណើរការ (How to run)

```bash
cd nearu-backend
node server.js
```

Server នឹងដំណើរការនៅ: **http://localhost:3000**

មិនត្រូវការ `npm install` — ប្រើតែ Node.js built-in modules ប៉ុណ្ណោះ។

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| student@nearu.com | password123 | student |
| sokha@nearu.com | password123 | landlord |
| dara@nearu.com | password123 | landlord |

---

## API Endpoints

### 1. Health check
```
GET /api/health
```

### 2. ចុះឈ្មោះ (Sign up)
```
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "yourpassword",
  "role": "student"   // or "landlord"
}
```

### 3. ចូលគណនី (Login)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@nearu.com",
  "password": "password123"
}
```
Response: `{ token, user }` — រក្សា `token` សម្រាប់ request បន្ទាប់។

### 4. ព័ត៌មានអ្នកប្រើ
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 5. បញ្ជីផ្ទះទាំងអស់ (List properties)
```
GET /api/properties
GET /api/properties?location=RUPP&maxPrice=150&type=Private%20Room&page=1&limit=6
GET /api/properties?sort=price_asc
GET /api/properties?maxDistance=1&amenity=Wi-Fi,Kitchen
```

Query params:
- `location` — ស្វែងរកតាមទីតាំង / សាកលវិទ្យាល័យ
- `university` — RUPP, RULE, PUC, NUM, ITC...
- `maxPrice`, `minPrice`
- `type` — Private Room | Apartment | House (comma-separated values match any selected type)
- `maxDistance` — គីឡូម៉ែត្រ
- `amenity` — Wi-Fi,Kitchen (comma separated)
- `sort` — price_asc | price_desc | distance
- `page`, `limit`

### 6. ផ្ទះណែនាំ (Featured)
```
GET /api/properties/featured
```

### 7. មើលផ្ទះមួយ
```
GET /api/properties/1
```

### 8. ដាក់ប្រកាសផ្ទះ (Landlord only)
```
POST /api/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Modern Room near RUPP",
  "price": 100,
  "location": "Toul Kork, Phnom Penh",
  "university": "RUPP",
  "distance": 0.8,
  "type": "Private Room",
  "amenities": ["Wi-Fi", "Air Conditioner"],
  "description": "Nice room for students",
  "image": "https://..."
}
```

### 9. កែ / លុបផ្ទះ
```
PUT  /api/properties/:id
DELETE /api/properties/:id
Authorization: Bearer <token>
```

### 10. ផ្ញើសារទៅម្ចាស់ផ្ទះ
```
POST /api/inquiries
Content-Type: application/json

{
  "propertyId": 1,
  "name": "Student Name",
  "email": "student@email.com",
  "phone": "+855...",
  "message": "I want to view this room"
}
```

### 11. មើលសារដែលបានទទួល (Landlord)
```
GET /api/inquiries
Authorization: Bearer <token>
```

---

## របៀបភ្ជាប់ Frontend

នៅក្នុង `login.html` / `signup.html` ប្តូរ form submit ទៅហៅ API:

```javascript
// Login example
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
if (data.token) {
  localStorage.setItem('nearu_token', data.token);
  localStorage.setItem('nearu_user', JSON.stringify(data.user));
  window.location.href = 'index.html';
}
```

```javascript
// Fetch listings
const res = await fetch('http://localhost:3000/api/properties?maxPrice=150');
const data = await res.json();
console.log(data.properties);
```

---

## រចនាសម្ព័ន្ធឯកសារ

```
nearu-backend/
├── server.js      ← API server សំខាន់
├── db.js          ← Database (JSON file)
├── auth.js        ← Token / password
├── data/
│   └── nearu.json ← ទិន្នន័យរក្សាទុក
├── package.json
└── README.md
```

## បច្ចេកវិទ្យា

- **Node.js** http module (មិនត្រូវការ Express)
- **JSON file** database (ងាយស្រួល, មិនត្រូវការ MongoDB)
- **scrypt** password hashing
- **HMAC-SHA256** JWT-like tokens
- **CORS** បើកសម្រាប់ frontend

## ជំហានបន្ទាប់ (Optional)

1. ប្តូរទៅ MongoDB / PostgreSQL នៅពេល production
2. បន្ថែម upload រូបភាព (Cloudinary / local disk)
3. បន្ថែម email notification សម្រាប់ inquiry
4. Deploy លើ Railway, Render, ឬ VPS
