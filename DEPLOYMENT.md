# StockMaster Deployment Guide (Render + Vercel) 🚀

This guide provides step-by-step instructions to deploy your **Backend on Render** and **Frontend on Vercel**.

---

## ✅ Prerequisites

1.  **GitHub Account**: Ensure your code is pushed to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).

---

## 1️⃣ Part 1: Deploy Backend on Render

### Step 1: Create Database (PostgreSQL)
1.  Log in to your **Render Dashboard**.
2.  Click **New +** and select **PostgreSQL**.
3.  **Name**: `stockmaster-db` (or any name).
4.  **Database**: `stockmaster`.
5.  **User**: `stockmaster_user`.
6.  **Region**: Choose the one closest to you (e.g., Singapore, Frankfurt).
7.  **Instance Type**: Select **Free**.
8.  Click **Create Database**.
9.  Wait for it to be created. Once done, copy the **Internal Database URL** (starts with `postgres://...`) from the **Connections** section. You will need this later.

### Step 2: Create Backend Web Service
1.  Click **New +** and select **Web Service**.
2.  Connect your **GitHub Repository**.
3.  **Name**: `stockmaster-backend`.
4.  **Region**: Same as your database.
5.  **Branch**: `main` (or your default branch).
6.  **Root Directory**: `Backend` (Important!).
7.  **Runtime**: `Node`.
8.  **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
    *   *This installs dependencies and runs database migrations.*
9.  **Start Command**: `npm start`
10. **Instance Type**: Select **Free**.

### Step 3: Configure Environment Variables
Scroll down to the **Environment Variables** section and add the following keys:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | Paste the **Internal Database URL** you copied from the database step. |
| `JWT_SECRET` | Enter a strong secret key (e.g., `my-super-secret-key-123`). |
| `NODE_ENV` | `production` |
| `EMAIL_USER` | `golunrajput@gmail.com` |
| `EMAIL_PASSWORD` | `cihsimxytxzmzlur` |

### Step 4: Deploy
1.  Click **Create Web Service**.
2.  Render will start building your app. Watch the logs.
3.  Once deployed, you will see a URL like `https://stockmaster-backend.onrender.com`. **Copy this URL.**

---

## 2️⃣ Part 2: Deploy Frontend on Vercel

### Step 1: Import Project
1.  Log in to your **Vercel Dashboard**.
2.  Click **Add New...** -> **Project**.
3.  Import your **StockMaster** repository.

### Step 2: Configure Project
1.  **Framework Preset**: Vercel should auto-detect **Vite**. If not, select it.
2.  **Root Directory**: Click `Edit` and select the `StockMaster` folder.

### Step 3: Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | Paste your Render Backend URL + `/api` (e.g., `https://stockmaster-backend.onrender.com/api`) |

### Step 4: Deploy
1.  Click **Deploy**.
2.  Vercel will build your frontend.
3.  Once done, you will get a domain like `https://stockmaster.vercel.app`.

---

## 3️⃣ Part 3: Final Configuration & Seeding

### Step 1: Seed Initial Data (Admin User)
Since this is a fresh database, you need to create the admin user.

1.  Go to your **Render Dashboard**.
2.  Click on your **Web Service** (`stockmaster-backend`).
3.  Go to the **Shell** tab (on the left).
4.  Wait for the terminal to connect.
5.  Run the seed command:
    ```bash
    npm run seed
    ```
6.  You should see "Seeding completed".

### Step 2: Update Backend CORS (Optional but Recommended)
Currently, your backend allows all origins. For better security, update `Backend/server.js` to allow only your Vercel domain.

1.  In `Backend/server.js`:
    ```javascript
    app.use(cors({
        origin: ['https://your-stockmaster.vercel.app', 'http://localhost:5173'],
        credentials: true
    }));
    ```
2.  Commit and push changes. Render will auto-deploy.

---

## 🎉 Done!
You can now log in to your app at your Vercel URL using:
*   **Email**: `admin@stockmaster.in`
*   **Password**: `password123`
