# Employee Leave Management System

A role-aware, enterprise-grade Employee Leave Management System built with a React + Vite frontend and Node.js + Express backend, connected to **TiDB Cloud (MySQL-Compatible)** with **Google OAuth 2.0 Single Sign-On** and **Role-Based Access Control (RBAC)**.

---

## 🏛 Architecture Overview

```text
leave-management-system/
│
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── assets/             # Static assets & icons
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── ProtectedRoute.jsx  # Reusable RBAC Route Guard
│   │   │       └── LoadingSpinner.jsx  # Reusable loading indicator
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Google Auth state, session checker & role helpers
│   │   ├── hooks/              # Custom React hooks (e.g. useFetch)
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx          # Header with user avatar, portal link & sign out
│   │   ├── lib/                # Utility helpers & class merger (cn)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx       # Google Identity Services Sign-In
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx  # Protected Admin Portal (role_id: 1)
│   │   │   ├── manager/
│   │   │   │   └── ManagerDashboard.jsx# Protected Manager Portal (role_id: 2)
│   │   │   ├── employee/
│   │   │   │   └── EmployeeDashboard.jsx# Protected Employee Portal (role_id: 3)
│   │   │   └── LandingPage.jsx         # Live system & database health check dashboard
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx           # Protected route hierarchy & role gates
│   │   ├── services/
│   │   │   └── api.js                  # API fetcher (Google login, /auth/me, /auth/logout)
│   │   ├── App.jsx             # Root React application
│   │   ├── main.jsx            # React DOM bootstrap
│   │   └── index.css           # Global Tailwind CSS styles
│   ├── index.html              # HTML shell & Google Identity Services SDK
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── vite.config.js          # Vite configuration
│   └── package.json
│
├── server/                     # Backend REST API (Node.js + Express.js)
│   ├── src/
│   │   ├── config/             # Environment validation (DB, Google OAuth, JWT, SSL)
│   │   ├── controllers/
│   │   │   ├── authController.js   # Google OAuth login, /auth/me, /auth/logout
│   │   │   └── healthController.js # API & DB health check controllers
│   │   ├── db/                 # TiDB connection pool, initDb & seedDb scripts
│   │   ├── middleware/
│   │   │   ├── auth.js             # requireAuth & requireRole RBAC middleware
│   │   │   ├── errorHandler.js     # Centralized error handler
│   │   │   └── notFoundHandler.js  # 404 Route Not Found middleware
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/auth routes
│   │   │   ├── healthRoutes.js     # /api/health routes
│   │   │   └── index.js            # Main API router aggregator
│   │   ├── services/
│   │   │   └── authService.js      # google-auth-library token verification & DB lookups
│   │   ├── test/
│   │   │   └── authTest.js         # Automated auth and RBAC unit test suite
│   │   ├── utils/
│   │   │   ├── jwt.js              # JWT signing, verification & HTTP-only cookies
│   │   │   └── response.js         # Standard JSON response formatting
│   │   ├── validators/
│   │   │   └── authValidator.js    # Zod payload validation schemas
│   │   ├── app.js              # Express app setup, cookie-parser, CORS credentials
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

## 👥 User Roles & Access Control Matrix

| Role | `role_id` | Portal Route | Permissions & Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `1` | `/admin` | System governance, department policies, user assignments |
| **Manager** | `2` | `/manager` | Team leave approvals, direct report calendars, team analytics |
| **Employee** | `3` | `/employee` | Submit leave requests, track approvals, view remaining balances |

> 🔒 **Security Rule**: The frontend never determines the user's role. The backend verifies the Google ID token, retrieves the user's verified role directly from the database, and issues an application JWT stored in an **HTTP-only cookie**.

---

## 🔑 Google OAuth 2.0 Setup

### 1. Create Credentials in Google Cloud Console

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** > **Credentials**.
3. Click **Create Credentials** > **OAuth client ID**.
4. Application type: **Web application**.
5. **Authorized JavaScript origins**:
   - `http://localhost:5173`
6. *(No Redirect URIs are needed since Google Identity Services operates in frontend JavaScript popup/callback mode).*
7. Copy the generated **Client ID**.

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 🏃 Starting the Application

### Option A: From Root Workspace

```bash
# Start Frontend (React + Vite on port 5173)
npm run dev

# Start Backend (Express + Nodemon on port 5001)
npm start
```

### Option B: From Individual Subdirectories

#### Backend:
```bash
cd server
npm start
```

#### Frontend:
```bash
cd client
npm run dev
```

---

## 🧪 Testing & Verification

### 1. Run Auth & RBAC Verification Tests

```bash
cd server
npm run test:auth
```
*Validates TiDB user records, JWT signing/verifying, and role portal routing matrix.*

### 2. Authentication API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/google` | Verify Google ID token, authenticate user & set session cookie | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile and active role | Yes (JWT Cookie) |
| `POST` | `/api/auth/logout` | Clear HTTP-only session cookie | No |

---

## 🗺 Execution Roadmap

- [x] **Phase 1**: Project Structure & Development Environment Initialization
- [x] **Phase 2**: TiDB Cloud Database Schema & Connection Pool
- [x] **Phase 3**: Google OAuth Authentication & Role-Based Access Control (RBAC)
- [ ] **Phase 4**: Admin, Manager, and Employee Portals & Leave Management Engine
- [ ] **Phase 5**: Chart Analytics, Verification, & Polish
