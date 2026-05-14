# Agentic Surveillance Research — Frontend

A React + TypeScript dashboard for the
[Agentic Surveillance Research](../agentic-surveillance-research) FastAPI
service. Configure a city scan, watch the pipeline run, and explore the
enriched results — camera map with interactive hotspot overlays, a
cameras-per-road-km headline metric, statistical charts, an LLM
report, and an optional low-surveillance walking route.

## Features

- **Configurable scan** — pick a city, choose a `basic` or `full` preset,
  toggle individual outputs (heatmap, hotspots, charts, report) and
  optionally add a routing request with start/end coordinates and a
  per-camera filter (operator / surveillance type / sensitive-only).
- **Live progress** — polling-based progress bar with per-stage status
  and elapsed-time / staleness indicators.
- **Dashboard tabs**:
  - **Camera Map** — Leaflet markers with an operator / privacy /
    sensitivity filter pane, plus a floating **Hotspot Layers** control
    that toggles three independent overlays:
    - _KDE density contours_ — planar kernel-density polygons at the
      50/75/90/95 percentiles.
    - _Gi\* hot/cold hexes_ — Getis-Ord Gi\* hex grid with FDR-adjusted
      p-values, classified hot/cold/not-significant.
    - _HDBSCAN polygons_ — density-based cluster hulls shaded by
      cluster persistence.
      Each layer loads its GeoJSON lazily and caches it for the
      session, scoped to the current `taskId` so a fresh run refetches.
      Per-layer inline legends and hover tooltips ship alongside each
      overlay.
  - **Heatmap** — folium HTML (derived from the KDE surface) embedded as
    an iframe.
  - **Statistics** — opens with a **cameras-per-road-km** headline
    callout next to **cameras-per-km²**, followed by privacy,
    sensitivity, zone-sensitivity, operator, manufacturer, and
    install-timeline charts (each with a captioned empty state when
    the underlying data is missing).
  - **Report** — markdown city report rendered with `react-markdown`.
  - **Route** _(optional)_ — folium map of the chosen low-surveillance
    walking route.
- **Last-results recall** — completed scans persist in `localStorage`
  so the dashboard reopens at a click.

## Hotspot methodology

The dashboard surfaces a four-layer hotspot analysis (paired with
backend v2.4.0+). The layers are complementary — each answers a
different question — and any combination can be toggled on at once.

1. **HDBSCAN polygons** — density-based clusters with locally-adaptive
   `ε`, so dense downtown blocks don't fuse with sparse suburbs.
2. **KDE density surface** — FFT-based planar kernel density on a
   metric grid; the smooth heatmap and the contour polygons are both
   derived from it.
3. **Getis-Ord Gi\* hex grid** — the statistic researchers and
   journalists recognise from ArcGIS/QGIS "Hot Spot Analysis", with
   FDR-adjusted p-values.
4. **Cameras per road-km** — a single citable headline figure for
   cross-city comparison (Stanford Computational Policy Lab,
   _Surveilling Surveillance_, 2021), shown above the Statistics
   tab. Reuses the routing agent's OSMnx graph cache.

Method references: Amnesty International,
_Decode Surveillance NYC_; Stanford Computational Policy Lab, _Surveilling Surveillance_
(2021).

## Stack

React 19 · TypeScript 5.9 · Vite 7 · MUI 7 · Tailwind 4 ·
Leaflet / react-leaflet · axios · react-markdown.

## Getting started

### Prerequisites

- Node.js ≥ 18
- A running backend at `http://127.0.0.1:8080`. See the
  [agentic-surveillance-research](../agentic-surveillance-research)
  README for how to start it (`bash start_uvicorn_dev.sh`).

### Install & run

```bash
git clone git@github.com:jethronap/UNDO-agentic-ui.git
cd UNDO-agentic-ui
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

The dev server proxies `/api/*` to `127.0.0.1:8080` (see
`vite.config.ts`), so the frontend works against any backend on that
port without further configuration.

### Build

```bash
npm run build       # tsc -b && vite build → dist/
npm run preview     # serve the production build locally
```

## Project layout

```
src/
├── api/              # axios client, /pipeline and /outputs wrappers
├── components/
│   ├── form/         # PipelineConfig — scan + routing form
│   ├── monitor/      # ProgressMonitor + PipelineStepper
│   ├── dashboard/    # Dashboard, StatsPanel
│   │   └── stats/    # DensityMetricsCallout (cameras-per-road-km tile)
│   ├── map/          # SurveillanceMap, CameraFilterPanel, MapPicker
│   │   └── layers/   # KDE / Gi* / HDBSCAN overlays + HotspotLayerControl
│   └── ScanWorkflow  # top-level config → monitor → dashboard router
├── hooks/            # useSnackbar, useWebSocket
└── types/api.d.ts    # request / response shapes mirroring the backend
```

## Development workflow

- **Lint** — `npm run lint` (ESLint + `typescript-eslint`).
- **Format** — Prettier; runs automatically via `lint-staged` on commit.
- **Pre-commit hook** — Husky runs `lint-staged`, which lints + formats
  staged files. A failed lint blocks the commit; fix and retry.
- **Type-check only** — `npx tsc -b`.
