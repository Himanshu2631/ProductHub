# ProductHub - API & Frontend Demo

A simple, beginner-friendly Express server + PostgreSQL API with cursor-based pagination and a clean, responsive single-page frontend.

---

## Local Setup

### 1. Prerequisites
Ensure you have **Node.js** and a **PostgreSQL** database server installed and running on your machine.

### 2. Configure Environment
Create a `.env` file in the root folder and configure your local PostgreSQL database credentials:
```env
PORT=3000

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=producthub_db
DB_PASSWORD=password
DB_PORT=5432
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
This will automatically verify your database connection, execute `schema.sql` to build the tables/indexes, clear existing data, and batch insert 200,000 mock products:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser to explore the API.

---

## Deployment Guide

You can deploy the backend on **Render** (which serves the frontend automatically at the root `/` path) or deploy the frontend separately on **Vercel**.

### Phase 1: Deploy PostgreSQL Database

You can deploy your PostgreSQL database using cloud providers such as **Supabase**, **Neon.tech**, or **Render PostgreSQL**:

1. Create a free PostgreSQL instance on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Retrieve your connection details:
   - Host
   - Database Name
   - User
   - Password
   - Port (usually 5432)

---

### Phase 2: Deploy Backend on Render

1. Commit and push your code to a public or private **GitHub** repository.
2. Sign up at [Render](https://render.com) and link your GitHub account.
3. Click **New +** and select **Web Service**.
4. Select your `ProductHub` repository.
5. Configure the Web Service:
   - **Name:** `producthub-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Click **Advanced** and add the following **Environment Variables**:
   - `PORT`: `10000`
   - `DB_USER`: *Your cloud DB username*
   - `DB_HOST`: *Your cloud DB host*
   - `DB_DATABASE`: *Your cloud DB database name*
   - `DB_PASSWORD`: *Your cloud DB password*
   - `DB_PORT`: `5432`
7. Click **Deploy Web Service**.
8. Once deployed, Render will provide a live URL (e.g., `https://producthub-api.onrender.com`).
   *Note: Since the Express server serves `index.html` at the root path, navigating to this URL will immediately load your frontend!*

---

### Phase 3: Deploy Frontend on Vercel (Optional)

If you wish to deploy the frontend separately on **Vercel** instead of serving it from Render:

1. Open [index.html](index.html) and locate the configuration variables around line 370:
   ```javascript
   // Configuration: If you deploy the frontend separately (e.g. to Vercel), paste your deployed Render backend URL here
   const DEPLOYED_BACKEND_URL = 'https://producthub-api.onrender.com'; 
   ```
   Paste your live Render URL inside `DEPLOYED_BACKEND_URL`.
2. Sign up at [Vercel](https://vercel.com) and connect your GitHub repository.
3. Import your project.
4. Click **Deploy**.
5. Vercel will provide a live link to your static page which communicates directly with the Render backend.
