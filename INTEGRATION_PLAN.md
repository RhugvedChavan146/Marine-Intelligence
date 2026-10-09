
# Live API Integration Plan

## Overview
This plan details the integration of the live observation data endpoint (`http://163.128.209.18:8013/`) into the MMR (Mumbai Metropolitan Region) Intelligence Console.

---

## 1. Endpoint Verification & Capabilities
- **Base URL**: `http://163.128.209.18:8013`
- **Service Name**: VANA MasterDB Observation API (v1.0.0, FastAPI / Uvicorn)
- **Verified Active Endpoints**:
  - `GET /health`: Health status payload `{"status":"healthy","service":"VANA MasterDB Observation API","version":"1.0.0"}`
  - `GET /observations/{observation_id}`: Retrieve observation payload by ID
  - `POST /observations`: Ingest observation payload
  - `GET /official/forest-cover/{record_id}`: Retrieve forest cover data
  - `POST /official/forest-cover`: Ingest official forest cover record

---

## 2. Configuration & Environment
- **`.env` Configuration**:
  - Define `VITE_MMR_API_BASE_URL=http://163.128.209.18:8013` in `c:\Marine Intelligence\MMR\.env`.
- **Default Fallback**:
  - Set default `LIVE_API_BASE` in `src/apiClient.js` to `http://163.128.209.18:8013`.

---

## 3. Implementation Steps

### Step 1: Environment File Setup
- Create `.env` file in `MMR/` defining `VITE_MMR_API_BASE_URL=http://163.128.209.18:8013`.

### Step 2: Refactor `apiClient.js` for Live API Integration
- Implement `fetchLiveApiStatus()`:
  - Perform `fetch(`${LIVE_API_BASE}/health`)` with a 3-second timeout controller.
  - Return `{ state: 'ONLINE', source: LIVE_API_BASE, timestamp: new Date().toISOString(), message: 'Live VANA Observation API connected (http://163.128.209.18:8013)' }` when healthy.
  - Fall back gracefully to `UNAVAILABLE` or `OFFLINE` if unreachable.
- Refactor `getMmrSnapshot()`:
  - Check live API status.
  - Attempt live observation fetch if available, merging with verified canonical local layer.
  - Provide complete fallback to local canonical snapshot on network failure.

### Step 3: Update `App.jsx` UI State
- Convert static `liveStatus` to reactive state `useState({ state: 'CHECKING', source: LIVE_API_BASE, timestamp: null, message: 'Checking live endpoint...' })`.
- Fetch live API status on component mount and on refresh action (`↻`).

---

## 4. Verification Plan
- Verify live health check response from `http://163.128.209.18:8013/health`.
- Test local dev server (`npm run dev`) and verify topbar status displays `API ONLINE` / `READY`.
