# IC ORIGIN: Platform Walkthrough

**Current Version:** 1.0.1 (Alpha)
**Core Function:** Automated Capital Market Intelligence & "Zombie Deal" Monitoring.

---

## 1. The Core Workflows

### A. The "Market Sweep" (General Intelligence)
*   **What it does:** Continuously scans the open web (via Google News RSS) for keywords related to **Distress**, **Insolvency**, and **Restructuring**.
*   **How it works:**
    1.  **Sources:** Configured in `Settings -> Sources` (e.g., "Google News Bankruptcy UK").
    2.  **Ingestion:** The `MarketSweepService` fetches articles, extracts company names and context.
    3.  **Signal Generation:** Valid findings are stored as `Signals` in the dashboard.

### B. The "Zombie Hunter" (Targeted Monitoring)
*   **What it does:** specifically monitors a uploaded "Watchlist" of Broken or Paused deals for "Signs of Life".
*   **How it works:**
    1.  **Data:** Ingested from your Excel file (`Aborted and Paused deals.xlsx`) into Firestore `watchlists`.
    2.  **Targeted Scan:** The sweep engine explicitly searches for: `"{Company Name}" AND (refinancing OR acquisition OR "strategic review")`.
    3.  **Alerts:** Matches are tagged as **High Priority Watchlist Hits** in the Morning Pulse.

---

## 2. User Interface (The Dashboard)

### The "Morning Pulse" Card
*   **Purpose:** Your daily feed of intelligence.
*   **Features:**
    *   **Real-time Feed:** Displays the latest ingested signals.
    *   **Context Aware:** Filters signals based on your selected Industry (e.g., "Private Credit" vs "Real Estate").
    *   **"Run Sweep" Button:** Manually triggers the ingestion engine for instant updates.

### Global Controls
*   **Industry Switcher:** (Top Header) Allows you to switch your "Lens". Changing this updates the prompt context and the visible signals.
*   **Source Manager:** (`/settings/sources`) UI to add or remove RSS feeds dynamically without touching code.

---

## 3. Technical Architecture

### Backend: `Sentinel-Growth` (FastAPI)
*   **`src/services/market_sweep.py`:** The brain. Contains the logic for RSS parsing and User Watchlist matching.
*   **`src/api/*`:** Endpoints for the frontend (`/signals`, `/tasks/sweep`, `/sources`).
*   **Background Tasks:** The sweep runs asynchronously so the UI never freezes.

### Database: Google Firestore
*   **`auctions`:** Where raw intelligence signals live.
*   **`watchlists`:** Where your proprietary client targets live.
*   **`user_settings`:** Where generic app config lives.
*   **Security:** Protected by `firestore.rules` (only auth users can read/write sensitive data).

### Scripts
*   **`seed_watchlist.py`:** The specialized script that reads your Client Excel Mapping and populates the Zombie Hunter database.

---

## 4. How to Operate

1.  **Add Targets:** Drop a new Excel file in `data/` and run `python scripts/seed_watchlist.py`.
2.  **Update Sources:** Go to Settings in the UI to add new RSS keywords.
3.  **Get Intel:** Click **"Run Sweep"** on the dashboard or wait for the scheduled cron job (future).
