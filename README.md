# Employee Leave Management System

A role-aware, enterprise-grade Employee Leave Management System built with a React + Vite frontend and Node.js + Express backend, connected to **TiDB Cloud (MySQL-Compatible)** with Google OAuth RBAC.

---

## 🏛 Architecture Overview

```text
leave-management-system/
│
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── assets/             # Static assets & icons
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext & role definitions
│   │   ├── hooks/              # Custom React hooks (e.g. useFetch)
│   │   ├── layouts/            # Page layouts & navigation
│   │   ├── lib/                # Utility helpers & class merger (cn)
│   │   ├── pages/              # Portal pages (Auth, Admin, Manager, Employee)
│   │   ├── routes/             # App routing definitions
│   │   ├── services/           # API integration layer & health check client
│   │   ├── App.jsx             # Main App root component
│   │   ├── main.jsx            # React DOM mounting
│   │   └── index.css           # Global Tailwind CSS styles
│   ├── index.html              # HTML shell & font definitions
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── vite.config.js          # Vite configuration
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express.js)
│   ├── src/
│   │   ├── config/             # Environment validation & SSL configuration
│   │   ├── controllers/        # Route controllers (API & DB health checks)
│   │   ├── db/                 # TiDB connection pool, initDb & seedDb scripts
│   │   ├── middleware/         # Error handling, 404 handler & middlewares
│   │   ├── routes/             # API routing
│   │   ├── services/           # Business logic layer
│   │   ├── utils/              # Standard response formatting & helpers
│   │   ├── validators/         # Zod schemas & input validation
│   │   ├── app.js              # Express app setup & middleware stack
│   │   └── server.js           # Server entry point & graceful shutdown
│   └── package.json
│
├── database/                   # Database DDL Schemas & Seeds
│   ├── schema.sql              # TiDB MySQL DDL schema (7 relational tables)
│   └── seed.sql                # Seed data for roles, leave types, and dev users
│
├── .gitignore                  # Git ignore rules (protects .env and credentials)
├── .env.example                # Root environment variables reference
└── README.md                   # Project documentation
```

---

## 👥 User Roles (RBAC)

| Role | `role_id` | Description |
| :--- | :--- | :--- |
| **Admin** | `1` | Leave policy administration, department setup, organizational metrics |
| **Manager** | `2` | Team leave approvals, direct report balances, calendar management |
| **Employee** | `3` | Apply for leaves, track status, view personal leave balances |

---

## 🗄 TiDB Cloud Database Setup

### 1. Prerequisites & Obtaining Connection Details

1. Sign up / log in to [TiDB Cloud](https://tidbcloud.com/).
2. Create a Serverless Cluster (e.g., in AWS `ap-southeast-1` or your preferred region).
3. Click **Connect** on the cluster overview page:
   - Select **General** connection method.
   - Note the **Host**, **Port** (usually `4000`), **User**, **Password**, and **Database Name** (e.g. `test` or `leave_management_db`).

### 2. Configure Environment Variables

Create a `.env` file in `server/` (or at the root):

```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# TiDB Cloud Credentials
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_prefix.root
DB_PASSWORD=your_secure_tidb_password
DB_NAME=leave_management_db

# Optional Custom CA Certificate (if required by your OS environment)
# DB_SSL_CA=/path/to/isrgrootx1.pem

# Connection Pool Settings
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
```

### 3. SSL / CA Certificate Support

TiDB Cloud Serverless requires TLS 1.2+ encrypted connections.
- The `mysql2/promise` connection pool automatically enables TLS encryption with `{ minVersion: 'TLSv1.2', rejectUnauthorized: true }`.
- If your environment requires an explicit CA bundle (e.g., `isrgrootx1.pem`), specify its path in `DB_SSL_CA`.

---

## 🚀 Database Migration & Seeding

### Initialize Schema (Tables & Constraints)

To create all 7 relational tables in TiDB Cloud without dropping existing data:

```bash
cd server
npm run db:init
```

### Seed Initial Roles & Leave Types

To insert roles (`Admin: 1`, `Manager: 2`, `Employee: 3`) and default leave categories idempotently:

```bash
cd server
npm run db:seed
```

---

## 📋 Database Tables Summary

1. **`roles`**: System roles (`id`, `name`, `description`, `created_at`).
2. **`users`**: User records with Google IDs, roles, managers, and departments.
3. **`leave_types`**: Configurable leave policies (Casual, Sick, Earned, Optional).
4. **`leave_balances`**: Quota and balance tracking per employee per year.
5. **`leave_requests`**: Applications, status (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), manager responses, review audit timestamps.
6. **`notifications`**: In-app notifications linked to leave status transitions.
7. **`audit_logs`**: Compliance trail for role updates, manager assignments, and approvals.

---

## 🏃 Starting the Application

### Option A: From Root Workspace

```bash
# Start Frontend (React + Vite)
npm run dev

# Start Backend (Express + Nodemon)
npm start
```

### Option B: From Individual Subdirectories

#### 1. Start Backend API

```bash
cd server
npm install
npm start
```
- API Server: `http://localhost:5001`
- Health check (API): `http://localhost:5001/api/health`
- Health check (DB) : `http://localhost:5001/api/health/db`

#### 2. Start Frontend Application

```bash
cd client
npm install
npm run dev
```
- Client App: `http://localhost:5173`

---

## 🩺 Health Check Verification

### API Health Check
```bash
curl http://localhost:5001/api/health
```
```json
{
  "success": true,
  "message": "Leave Management System API is running smoothly",
  "status": "healthy"
}
```

### TiDB Database Health Check
```bash
curl http://localhost:5001/api/health/db
```
When configured and connected:
```json
{
  "success": true,
  "message": "Database connection is healthy",
  "database": "connected",
  "version": "8.0.11-TiDB-v8.5.0",
  "databaseName": "leave_management_db"
}
```
When unconfigured:
```json
{
  "success": false,
  "message": "Database connection is not configured",
  "database": "unconfigured",
  "missing": ["DB_HOST (or DATABASE_HOST)", "DB_USER (or DATABASE_USER)", "DB_PASSWORD (or DATABASE_PASSWORD)", "DB_NAME (or DATABASE_NAME)"]
}
```

---

## ⚠️ Common Database Troubleshooting

1. **`ER_ACCESS_DENIED_ERROR` / Invalid credentials**:
   - Double check your `DB_USER` (TiDB Cloud users include cluster prefix like `xxxx.root`) and `DB_PASSWORD`.
2. **`ETIMEDOUT` / Network connectivity**:
   - Ensure your IP is allowed in TiDB Cloud Console -> Security -> IP Access List (or allow `0.0.0.0/0` for development).
3. **`HANDSHAKE_SSL_ERROR`**:
   - Ensure your Node.js version supports TLS 1.2+ and system certificates are up to date.

---

## 🗺 Execution Roadmap

- [x] **Phase 1**: Project Structure & Environment Initialization
- [x] **Phase 2**: TiDB Cloud Database Schema & Connection Pool
- [ ] **Phase 3**: Google OAuth Authentication & Role-Based Authorization
- [ ] **Phase 4**: Admin, Manager, and Employee Portals & Leave Management Engine
- [ ] **Phase 5**: Chart Analytics, Verification, & Polish
