# 🌊 MMR Marine Intelligence Console

> **Spatial GIS & Decision Support System for Mumbai Metropolitan Region (MMR) Marine Infrastructure and Inland Waterway NW-53 Corridor Analysis.**

---

## 📌 Overview

The **MMR Marine Intelligence Console** is a web-based spatial dashboard designed to analyze and evaluate marine logistics, port connectivity, and inland waterway infrastructure across the Mumbai Metropolitan Region (MMR). Focusing on the **NW-53 Waterway Corridor**, the system integrates interactive GIS spatial mapping, live observation feeds, environmental constraint checks, and automated feasibility assessments to streamline decision-making.

---

## ✨ Key Features

- 🗺️ **Interactive Marine Spatial Map**:
  - Built with Leaflet.js with bounds optimized for the MMR coastal envelope (`[18.86, 72.74]` to `[19.39, 73.18]`).
  - Interactive layer toggles for **NW-53 Waterway**, **IWT Terminals & Jetties**, **Ports**, **Logistics Clusters**, **Environmental Constraints**, and **Feasibility Overlays**.
- 🔍 **Asset Inspection & Provenance**:
  - Detailed asset inspection cards (Kolshet Jetty, Gaimukh Jetty, Rewas Port, JNPT, Mumbai Port, Bhiwandi Logistics Cluster).
  - Haversine straight-line distance calculations and infrastructure metadata.
- ⚡ **Decision Loop & Scenario Modeling**:
  - Dynamic decision support loop for spatial governance.
  - Multi-scenario lenses: *Baseline Network*, *Jetty Expansion Candidate*, and *Environmental Clearance Lens*.
- 📡 **Live API Synchronization with Graceful Fallbacks**:
  - Direct integration with VANA MasterDB Observation API (`FastAPI / Uvicorn`).
  - Auto-checks health status (`/health`) and falls back smoothly to verified canonical local snapshots when offline or unreachable.
- 🌿 **Environmental Risk & Clearance Tracking**:
  - Highlights environmental constraints such as the **Thane Creek Ramsar Wetland Site** (Ramsar Site No. 2490) to enforce ecological clearance protocols.

---

## 🛠️ Technology Stack

- **Frontend**: React 18+, Vite
- **Mapping Engine**: Leaflet 1.9
- **API Client**: Fetch API with `AbortController` timeout handling
- **Styling**: Modern CSS modules / scoped JavaScript style tokens
- **Data Layers**: Canonical GeoJSON Envelopes (`IWAI`, `RAMSAR`, `National GIS Layer`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Installation

1. Navigate to the `MMR` directory:
   ```bash
   cd MMR
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):
   Create or edit `.env` in the `MMR/` folder:
   ```env
   VITE_MMR_API_BASE_URL=http://163.128.209.18:8013
   ```

4. Start Development Server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📜 Available Scripts

In the `MMR` folder, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Bundles production build into `dist/`. |
| `npm run preview` | Previews production build locally. |

---

## 📁 Project Structure

```
MMR/
├── .env                       # Environment configuration (VITE_MMR_API_BASE_URL)
├── INTEGRATION_PLAN.md        # Technical specification for live observation API integration
├── index.html                 # HTML application entry point
├── package.json               # NPM scripts and project dependencies
├── src/
│   ├── App.jsx                # Main application UI layout & state management
│   ├── main.jsx               # Application bootstrap
│   ├── apiClient.js           # API synchronization layer & fallback handling
│   ├── mmrData.js             # Data parser for spatial layers & canonical geometries
│   └── styles.js              # Theme tokens & component styling definitions
└── dist/                      # Production build output
```

---

## 🔌 Live API Endpoints

When connected to the VANA MasterDB Observation API (`http://163.128.209.18:8013`), the console verifies:

- **`GET /health`** - System readiness check
- **`GET /observations/{observation_id}`** - Real-time observation payload retrieval
- **`GET /official/forest-cover/{record_id}`** - Forest cover & Ramsar environmental records

---


