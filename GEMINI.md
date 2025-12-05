# Agentic Surveillance Research Frontend - Development Plan

## 1. Objective
Create a modern, intuitive, and "smart-looking" web frontend for the Agentic Counter-Surveillance API. The app will allow users to configure surveillance scans, compute safe walking routes, monitor progress in real-time, and interactively visualize the results.

## 2. Tech Stack & Design Philosophy
- **Core:** React 18+, TypeScript
- **Build:** Vite
- **Styling Strategy:** Hybrid Approach
    - **Tailwind CSS:** Used for global layout, spacing, responsiveness, and typography. Chosen for speed and flexibility.
    - **Material UI (MUI) v5:** Used for complex interactive components (Forms, Sliders, Steppers, Switches, Cards). Chosen for its polished "Google-style" aesthetic and accessibility.
    - *Integration:* Tailwind will handle the macro-layout, while MUI components will be styled via their `sx` prop or theme overrides only when necessary to blend with the Tailwind design system.
- **Mapping:** React Leaflet + Leaflet
    - *Why:* Lightweight, native support for GeoJSON layers, compatible with OpenStreetMap tiles.
- **Networking:** Axios (HTTP), Native WebSocket API (Streaming updates).
- **State Management:** React Context (Global App State).

## 3. Architecture & User Flow

### Phase 1: Configuration (The "Command Center")
**Route:** `/`
- **Hero Section:** Title and simple description.
- **Input Form (Maps to `POST /api/v1/pipeline/run`):**
    - **City Name:** Text Input (Required).
    - **Country Code:** Text Input (Optional, e.g., "DE", "GR").
    - **Scenario:** Select Dropdown (`basic` [default], `full`, `quick`, `report`, `mapping`).
- **Routing Toggle:** "Compute Safe Route" switch.
    - If enabled, reveals a **Mini Map** (Leaflet).
    - User clicks to set `Start` (Green Pin) and `End` (Red Pin).
    - Coordinates are captured for the `routing_config` payload.
- **Action:** Large "Start Surveillance Scan" button. Triggers API POST and redirects to `/processing/{taskId}`.

### Phase 2: Execution (The "Monitor")
**Route:** `/processing/{taskId}`
- **Real-time Connection:**
    - Connects to `WS /ws/tasks/{taskId}`.
    - Fallback polling to `GET /api/v1/pipeline/{taskId}` every 2s if WS fails.
- **UI Components:**
    - **Status Indicator:** Circular progress with percentage (0-100%).
    - **Pipeline Visualizer:** Vertical stepper matching backend stages:
        1. **Initialization** (Pending)
        2. **Scraping** (Downloading OSM data)
        3. **Analysis** (LLM Enrichment)
        4. **Routing** (Pathfinding - if enabled)
        5. **Completion** (Finalizing)
    - **Live Terminal:** Scrollable code-block displaying `message` fields from WS events.

### Phase 3: Visualization (The "Dashboard")
**Route:** `/results/{city}`
- **Data Source:** Fetches from `/api/v1/outputs/{city}/...`
- **Layout:** Sidebar (Tailwind Grid col-span-1) + Main Map (col-span-3).
- **Sidebar:**
    - **Stats Cards:**
        - Total Cameras (from `_enriched.json`)
        - Exposure Score (if routing enabled)
        - Route Length.
    - **Layers Control:**
        - Toggles for "Surveillance Cameras" (Markers).
        - Toggle for "Heatmap" (Overlay image).
        - Toggle for "Safe Route" (GeoJSON LineString).
    - **Downloads:** Links to direct file endpoints (`/geojson`, `/map`, `/stats`).
- **Main Map:**
    - **Base Layer:** OpenStreetMap CartoDB DarkMatter (for "hacker" feel) or Standard.
    - **Overlays:**
        - `_enriched.geojson`: Custom markers for cameras.
        - `route.geojson`: Color-coded polyline (Green=Safe, Red=Risky).

## 4. Directory Structure
```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/       # Navbar, Container (Tailwind based)
│   │   ├── form/         # Config inputs (MUI), Map Picker
│   │   ├── monitor/      # WebSocket terminal, Progress bars
│   │   └── map/          # Leaflet wrappers, GeoJSON layers
│   ├── api/              # Axios client, endpoints definitions
│   ├── hooks/            # usePipeline, useWebSocket
│   ├── types/            # TypeScript interfaces (mirrors backend Pydantic models)
│   ├── theme.ts          # MUI Theme config
│   ├── index.css         # Tailwind directives
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts        # Proxy configuration for /api -> localhost:8080
├── tailwind.config.js    # Tailwind configuration
└── package.json
```

## 5. Development Steps
1. [ ] **Scaffold:** Initialize Vite project (React + TS).
2. [ ] **Styling Setup:** Install Tailwind CSS (init, postcss) and MUI. Configure them to coexist.
3. [ ] **API Layer:** Define TypeScript interfaces for `PipelineRequest`, `TaskResponse`, `WebSocketMessage`.
4. [ ] **Feature: Config:**
    - Build form layout with Tailwind.
    - Implement MUI inputs.
    - Add Leaflet "Point Picker" for routing coordinates.
5. [ ] **Feature: Monitor:**
    - Implement `useWebSocket` hook.
    - Build the "Terminal" UI and Stepper.
6. [ ] **Feature: Dashboard:**
    - Create Leaflet Map component.
    - Implement fetching logic for GeoJSON and Stats.
    - Add "Layer Control" logic.
7. [ ] **Integration & Polish:**
    - Test against local backend.
    - Refine error handling and loading states.
    - Final UI tweaks (Dark mode, spacing).