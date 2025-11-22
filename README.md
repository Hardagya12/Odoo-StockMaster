# 📦 StockMaster - Advanced Inventory Management System

StockMaster is a modern, full-stack inventory management solution designed to streamline stock operations. It features a robust backend, a responsive neobrutalist frontend, and comprehensive features for managing products, warehouses, and stock movements.

![StockMaster Dashboard](https://odoo-stock-master.vercel.app/)

## 📺 Demo Video
[![StockMaster Demo Video](https://img.youtube.com/vi/MoeaTaQcLj4/0.jpg)](https://youtu.be/MoeaTaQcLj4)




## Team Members
1. Hardagya Rajput

## Problem Statement -Stock Master
## Reviewer name : Aman Patel (ampa)

## 🚀 Features

### 🏭 Core Inventory Management
- **Products & Categories**: Manage detailed product information with categorization.
- **Warehouses & Locations**: Multi-warehouse support with granular location tracking.
- **Stock Levels**: Real-time tracking of quantity on hand and reserved stock.

### 🚚 Operations
- **Receipts (Inbound)**: Manage incoming shipments from vendors.
  - Draft -> Ready -> Done workflow
  - Automatic stock updates upon validation
- **Deliveries (Outbound)**: Handle customer orders and outgoing shipments.
  - Stock reservation system
  - Validation checks for availability
- **Internal Transfers**: Move stock between locations or warehouses.
- **Inventory Adjustments**: Correct stock discrepancies manually.

### 📊 Dashboard & Analytics
- **Real-time KPIs**: Total products, low stock alerts, pending operations.
- **Visual Charts**: Stock distribution and movement trends.
- **Activity Logs**: Comprehensive history of all stock moves.

### 🔐 Authentication & Security
- **Secure Auth**: JWT-based authentication with bcrypt password hashing.
- **Password Reset**: Secure OTP-based password reset flow via Email.
- **Role-based Access**: Admin and user roles (extensible).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS with **Neobrutalism** design system
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JSON Web Tokens (JWT)
- **Email**: Nodemailer (Gmail SMTP)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/stockmaster.git
cd stockmaster
```

### 2. Backend Setup
```bash
cd Backend
npm install

# Create .env file
cp .env.example .env
# Update DATABASE_URL and other secrets in .env

# Run Migrations
npx prisma migrate dev

# Seed Initial Data (Admin User & Demo Data)
npm run seed

# Start Server
npm run dev
```

### 3. Frontend Setup
```bash
cd StockMaster
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start Development Server
npm run dev
```

---

## 🌍 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockmaster"
JWT_SECRET="your_super_secret_key"
PORT=5000
NODE_ENV="development"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASSWORD="your_app_password"
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:5000/api"
```

---

## 🚀 Deployment

### Backend (Render)
1. Create a **Web Service** on Render connected to your repo (`Backend` directory).
2. Set Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run seed`
3. Set Start Command: `npm start`
4. Add Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, etc.).

### Frontend (Vercel)
1. Import project to Vercel (`StockMaster` directory).
2. Set Build Command: `npm run build`
3. Add Environment Variable: `VITE_API_URL` pointing to your Render backend URL.

---

## 🧪 API Documentation

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Set new password

### Stock Operations
- `GET /api/products` - List all products
- `GET /api/receipts` - List incoming receipts
- `POST /api/receipts` - Create new receipt
- `POST /api/receipts/:id/validate` - Validate receipt and update stock
- `GET /api/deliveries` - List outgoing deliveries
- `POST /api/deliveries/:id/validate` - Validate delivery

---

## 🎨 Design System

StockMaster uses a **Neobrutalist** design language:
- **Colors**: High contrast (Neo-Pink `#FF6B9D`, Neo-Yellow `#FFD93D`, Neo-Blue `#4D96FF`)
- **Typography**: Space Grotesk (Bold, Geometric)
- **Components**: Thick borders (`border-3 border-black`), hard shadows (`shadow-neo`), and bold interactions.

---

## 👥 Authors

- **Hardagya Rajput** - *Lead Developer*

---

## 📄 License

This project is licensed under the ISC License.
