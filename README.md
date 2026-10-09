# NearU – Student Rentals (Cambodia)

មួយ folder មាន Frontend + Backend ពេញលេញ

```
nearu/
├── frontend/          ← គេហទំព័រ (HTML)
│   ├── index.html
│   ├── listings.html
│   ├── login.html
│   ├── signup.html
│   ├── map.html
│   ├── landlords.html
│   ├── how-it-works.html
│   ├── property-detail.html
│   ├── frontend-api.js
│   └── image/
└── backend/           ← API Server
    ├── server.js
    ├── db.js
    ├── auth.js
    └── README.md
```

## របៀបដំណើរការ

### 1. ដំណើរការ Backend
```bash
cd nearu/backend
node server.js
```
→ http://localhost:3000

### 2. បើក Frontend
បើក file `frontend/index.html` ក្នុង browser  
ឬប្រើ live server

## Demo Login
| Email | Password | Role |
|-------|----------|------|
| student@nearu.com | password123 | student |
| sokha@nearu.com | password123 | landlord |

## API
http://localhost:3000/api/health
http://localhost:3000/api/properties
