# 🌿 Green Basket — Farm to Table Platform

A full-stack web application connecting farmers directly to customers with automated delivery assignment.

---

## 📁 Project Structure

```
green-basket/
├── backend/
│   ├── config/
│   │   └── seed.js          # Sample data seeder
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── models/
│   │   ├── User.js          # User schema (farmer/customer/delivery/admin)
│   │   ├── Product.js       # Product schema
│   │   └── Order.js         # Order schema
│   ├── routes/
│   │   ├── auth.js          # /api/auth - Register, Login
│   │   ├── products.js      # /api/products - CRUD
│   │   ├── orders.js        # /api/orders - Place, view orders
│   │   ├── delivery.js      # /api/delivery - Delivery operations
│   │   └── admin.js         # /api/admin - Admin panel
│   ├── uploads/             # Product images (auto-created)
│   ├── server.js            # Express app entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
└── frontend/
    └── index.html           # Complete single-page frontend
```

---

## ⚙️ Setup Instructions (VS Code)

### Prerequisites
- Node.js (v16+) — https://nodejs.org
- MongoDB (local) — https://mongodb.com/try/download/community
- OR MongoDB Atlas (free cloud) — https://cloud.mongodb.com

---

### Step 1 — Install MongoDB
Download and install MongoDB Community Edition, then start the service:
```bash
# Windows: Start via Services panel or
mongod

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

---

### Step 2 — Setup Backend

Open terminal in VS Code and run:

```bash
# 1. Navigate to backend folder
cd green-basket/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env if needed (default settings work for local MongoDB)

# 4. Seed the database with sample data
node config/seed.js

# 5. Start the server
npm run dev
```

The API will be running at: **http://localhost:5000**

---

### Step 3 — Open Frontend

Simply open `frontend/index.html` in your browser.

> 💡 Tip: Use VS Code's **Live Server** extension (right-click → Open with Live Server) for best experience.

---

## 🔐 Demo Accounts

| Role     | Email                      | Password    |
|----------|---------------------------|-------------|
| Admin    | admin@greenbasket.com     | ************|
| Farmer   | farmer@greenbasket.com    | password123 |
| Customer | customer@greenbasket.com  | password123 |
| Delivery | delivery@greenbasket.com  | password123 |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint            | Description       |
|--------|---------------------|-------------------|
| POST   | /api/auth/register  | Register user     |
| POST   | /api/auth/login     | Login user        |
| GET    | /api/auth/me        | Get current user  |

### Products
| Method | Endpoint              | Description           | Access      |
|--------|-----------------------|-----------------------|-------------|
| GET    | /api/products         | List all products     | Public      |
| GET    | /api/products/my      | Farmer's products     | Farmer      |
| POST   | /api/products         | Add product           | Farmer      |
| PUT    | /api/products/:id     | Edit product          | Farmer      |
| DELETE | /api/products/:id     | Delete product        | Farmer      |

### Orders
| Method | Endpoint               | Description          | Access    |
|--------|------------------------|----------------------|-----------|
| POST   | /api/orders            | Place order          | Customer  |
| GET    | /api/orders/my         | My orders            | Customer  |
| GET    | /api/orders/farmer     | Farmer's orders      | Farmer    |
| PUT    | /api/orders/:id/cancel | Cancel order         | Customer  |

### Delivery
| Method | Endpoint                       | Description        | Access   |
|--------|--------------------------------|--------------------|----------|
| GET    | /api/delivery/orders           | Assigned orders    | Delivery |
| PUT    | /api/delivery/orders/:id/status| Update status      | Delivery |

### Admin
| Method | Endpoint                        | Description          | Access |
|--------|---------------------------------|----------------------|--------|
| GET    | /api/admin/stats                | Dashboard stats      | Admin  |
| GET    | /api/admin/users                | All users            | Admin  |
| GET    | /api/admin/orders               | All orders           | Admin  |
| PUT    | /api/admin/orders/:id/assign    | Assign delivery      | Admin  |
| DELETE | /api/admin/users/:id            | Delete user          | Admin  |

---

## 🔄 Order Flow

```
Customer places order
       ↓
System saves order (status: Pending)
       ↓
Auto-assigns available delivery boy (status: Assigned)
       ↓
Delivery boy marks "Out for Delivery"
       ↓
Delivery boy marks "Delivered"
       ↓
Payment status → Completed (COD collected)
```

---

## 💰 Payment System
- **Only Cash on Delivery (COD)**
- Payment status: `Pending` → `Completed` (on delivery)

---

## 🛠️ Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend  | Node.js + Express.js    |
| Database | MongoDB + Mongoose      |
| Auth     | JWT (JSON Web Tokens)   |
| Files    | Multer (image upload)   |

---

## 👥 User Roles

| Role      | Capabilities                                                    |
|-----------|-----------------------------------------------------------------|
| Farmer    | Add/edit/delete products, view received orders                 |
| Customer  | Browse products, cart, checkout, order history, cancel orders  |
| Delivery  | View assigned orders, update delivery status                   |
| Admin     | View all users/orders, assign delivery, platform stats         |

---

Made with 🌿 for college project demonstration
