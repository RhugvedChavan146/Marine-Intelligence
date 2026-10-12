# 🛡️ Role-Based Access Control (RBAC) & Authentication Documentation

> **Comprehensive Architecture, Security Specifications, and Implementation Guide for MMR Marine Intelligence Console.**

---

## 📌 1. Overview & Architecture

The **MMR Marine Intelligence Console** employs an end-to-end **Role-Based Access Control (RBAC)** architecture that bridges a lightweight **FastAPI** backend with a **React (Vite)** frontend. 

All authentication and authorization decisions are enforced **server-side** with cryptographic JSON Web Tokens (JWT) and persistent SQLite database storage. The frontend dynamically responds to the user's role by locking administrative features, gating decision pipelines, and providing a dedicated governance console.

```
┌────────────────────────────────────────────────────────┐
│                   React Frontend (MMR)                 │
│  - AuthModal (Sign In / Register)                      │
│  - Dynamic Header & Role Badge                         │
│  - Decision Loop Gating (Admin vs Viewer)              │
│  - User Management Console (Admin Only)                │
└──────────────────────────┬─────────────────────────────┘
                           │  HTTP / Bearer JWT Token
                           ▼
┌────────────────────────────────────────────────────────┐
│                FastAPI Backend API Engine              │
│  - Security Engine (PBKDF2-SHA256, JWT Tokens)         │
│  - Role Guard Dependencies (require_roles("admin"))    │
│  - Admin Safety Rules (Anti-Demotion, Anti-Self Delete)│
└──────────────────────────┬─────────────────────────────┘
                           │  SQL Queries (WAL Mode)
                           ▼
┌────────────────────────────────────────────────────────┐
│               SQLite Database (users table)            │
│  - id, name, email, password_hash, role, is_active     │
└────────────────────────────────────────────────────────┘
```

---

## 👥 2. Role Permissions Matrix

The system defines two primary operational roles: **ADMIN** and **VIEWER** (with support for **ANALYST** for domain assessments).

| Capability / Feature | 👁️ Viewer (Read-Only) | 🛡️ Admin (Full Control) | Enforcement Layer |
| :--- | :---: | :---: | :--- |
| **Public Self-Registration** | ✅ Yes (Default) | ❌ No (Cannot self-assign) | Backend (`POST /auth/register`) |
| **Spatial GIS Map Inspection** | ✅ Allowed | ✅ Allowed | Public / Client View |
| **Asset Inspection & Haversine Distance** | ✅ Allowed | ✅ Allowed | Public / Client View |
| **Observation Feed Monitoring** | ✅ Allowed | ✅ Allowed | Public / Client View |
| **Decision Loop Execution (Corridor Actions)** | ❌ Read-Only Lock | ✅ Full Control (Approve/Reject) | Client (`getActionCapabilities`) + API |
| **User Management Tab Visibility** | ❌ Hidden | ✅ Visible in Navigation | Client (`Header` component) |
| **User Directory Listing** | ❌ 403 Forbidden | ✅ Allowed | Backend (`GET /admin/users`) |
| **Role Modification** | ❌ 403 Forbidden | ✅ Allowed | Backend (`PATCH /admin/users/{id}/role`) |
| **User Suspension / Activation** | ❌ 403 Forbidden | ✅ Allowed | Backend (`PATCH /admin/users/{id}/active`) |
| **Permanent User Deletion** | ❌ 403 Forbidden | ✅ Allowed | Backend (`DELETE /admin/users/{id}`) |
| **Self-Account Deletion / Deactivation** | ❌ N/A | ❌ Blocked (Safety Guard) | Backend Safety Constraint |
| **Last Administrator Demotion Protection** | ❌ N/A | ❌ Blocked (Safety Guard) | Backend Safety Constraint |

---

## 🔒 3. Backend Security & Cryptography

Located in `Backend/marine-intelligence-task/backend/`:

### 3.1 Password Security (`security.py`)
- **Hashing Algorithm**: PBKDF2 with HMAC-SHA256 and 100,000 iterations using unique cryptographic salts (`os.urandom(16)`).
- **Format**: `pbkdf2:sha256:100000${salt_hex}${hash_hex}`.
- **Timing Attack Mitigation**: When an unrecognized email attempts to sign in, a `DUMMY_PASSWORD_HASH` is evaluated using constant-time `hmac.compare_digest` to ensure execution time remains identical regardless of account existence.

### 3.2 JWT Bearer Token System (`security.py`)
- **Signing Algorithm**: HMAC-SHA256 (`HS256`) using server-side secret key `AUTH_SECRET_KEY`.
- **Token Claims**: Subject (`sub` = user ID), issued at (`iat`), and expiration timestamp (`exp` = 60 minutes).
- **Authentication Dependency**: `get_current_user()` verifies the Bearer token header, decodes the subject, and verifies the user is active in the database.

### 3.3 Database Schema (`database.py`)
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL
);
```

### 3.4 Administrative Safety Constraints
1. **Anti-Orphan Admin Protection**: An admin cannot be demoted or deactivated if they are the last active administrator in the system (`409 Conflict`).
2. **Self-Harm Protection**: An active administrator cannot deactivate or permanently delete their own account (`409 Conflict`).
3. **Viewer Escalation Block**: Self-registration always sets `role = 'viewer'`. Passing `"role": "admin"` is rejected with `422 Unprocessable Entity`.

---

## 📡 4. Authentication API Specification

All endpoints are hosted on the backend server (`http://127.0.0.1:8000`).

### 4.1 Public Endpoints

#### `POST /auth/register`
Creates a new verified Viewer account.
- **Request Body**:
  ```json
  {
    "name": "Rhugved Chavan",
    "email": "user@example.com",
    "password": "Minimum12CharactersPassword!"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user object with `role: "viewer"`.
  - `409 Conflict`: If email is already registered.
  - `422 Unprocessable Entity`: Password < 12 characters, invalid email, or unauthorized fields.

#### `POST /auth/login`
Authenticates credentials and issues a JWT access token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Minimum12CharactersPassword!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "expires_in": 3600,
      "user": {
        "id": "uuid-here",
        "name": "Rhugved Chavan",
        "email": "user@example.com",
        "role": "viewer",
        "is_active": true,
        "created_at": "2026-10-12T07:46:40Z"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials or deactivated account.

---

### 4.2 Protected User Endpoint

#### `GET /auth/me`
Retrieves current profile from Bearer token.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with user profile.

---

### 4.3 Admin Governance Endpoints (Requires `role: "admin"`)

#### `GET /admin/users`
Lists all registered accounts and operational states.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**: `200 OK` (Array of user profiles).

#### `PATCH /admin/users/{user_id}/role`
Updates a user's role (`admin`, `analyst`, `viewer`).
- **Request Body**: `{"role": "analyst"}`
- **Response**: `200 OK` (Updated user profile).

#### `PATCH /admin/users/{user_id}/active`
Suspends or activates an account.
- **Request Body**: `{"is_active": false}`
- **Response**: `200 OK` (Updated user profile).

#### `DELETE /admin/users/{user_id}`
Permanently deletes a user from the SQLite database.
- **Response**: `200 OK` (`{"status": "deleted", "id": "..."}`).

---

## 💻 5. Frontend Implementation (`Frontend/MMR`)

### 5.1 API Client (`src/apiClient.js`)
- **Token Management**: `setStoredToken()`, `getStoredToken()`, `clearStoredToken()` using `localStorage` key `mmr_auth_jwt_token`.
- **Role Capabilities**:
  ```javascript
  export function getActionCapabilities(user) {
    if (!user) return { canAct: false, reason: 'Sign in required to execute operational decisions.' };
    if (!user.is_active) return { canAct: false, reason: 'Your account is suspended.' };
    if (user.role === 'admin') return { canAct: true, reason: 'Full administrative control active.' };
    return { canAct: false, reason: 'Viewer accounts have read-only observation permissions.' };
  }
  ```

### 5.2 Header Navigation & Profile Badge (`src/App.jsx`)
- **Unauthenticated State**: Shows `Sign In` button.
- **Authenticated State**:
  - Displays user avatar initial.
  - Displays formatted user name (via `getUserDisplayName()`), keeping email private in tooltip.
  - Role tag badge (`ADMIN` in amber, `VIEWER` in blue).
  - `Sign Out` button to invalidate session and reset UI.
- **User Management Tab**: Conditionally rendered exclusively when `user?.role === 'admin'`.

### 5.3 Decision Loop Governance (`src/App.jsx`)
- **Admin**: All corridor approval, rejection, and scenario deployment buttons are interactive.
- **Viewer / Guest**: Shows a persistent security banner (`🔒 READ-ONLY OBSERVATION MODE`) with disabled action buttons.

### 5.4 Admin User Management Console (`src/App.jsx`)
- **Account Metrics**: Total accounts, active admins, active viewers, and operational health counter.
- **User Directory Table**:
  - Full Name & Email display.
  - Role dropdown selector with live commit to backend.
  - Interactive Active / Suspended toggle.
  - **`🗑️ Delete` Button**: Confirms and permanently removes user accounts via the backend API.

### 5.5 Security Gateway Modal (`AuthModal`)
- **Zero Pre-Filled Secrets**: Completely clean, manual credential entry.
- **Browser Autofill Defense**:
  - `readOnly` protection on mount until focused to stop Chromium from auto-injecting passwords.
  - Hidden decoy trap inputs at the top of the form.
  - `autoComplete="new-password"` on sensitive fields.
  - Custom `-webkit-autofill` CSS rules in `src/styles.js` preserving the dark navy theme.
- **Input Validation**: RFC email validation, 12+ character password enforcement, and real-time confirm match indicators.

---

## 🧪 6. Testing & Verification

### Running Automated Backend Tests
From `Backend/marine-intelligence-task`:
```bash
python -m unittest discover -s tests -p "test_*.py"
```
Verifies:
1. Public registration generates `viewer` accounts.
2. Escalation attempts to `admin` during registration return `422`.
3. Admin routes reject unauthenticated and viewer requests with `401` / `403`.
4. Duplicate registrations return `409 Conflict`.

### Building Frontend Production Bundle
From `Frontend/MMR`:
```bash
npm run build
```
Ensures 0 syntax errors, valid JSX, and clean asset minification.
