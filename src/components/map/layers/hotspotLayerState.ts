// src/components/map/layers/hotspotLayerState.ts
//
// State surface for the hotspot layer-toggle UI. Kept in its own
// module — not next to ``HotspotLayerControl`` — so the component
// file stays Fast-Refresh-friendly (Vite's react-refresh plugin
// only re-runs files whose exports are all components).
//
// The state lives at the dashboard level so a tab switch off and
// back to the Camera Map preserves the toggles + cached GeoJSON.
// ``cacheKey`` (typically the pipeline ``taskId``) invalidates the
// cached layers across runs.

import type { HotspotFeatureCollection } from "../../../api/outputs";

export type HotspotLayerKey = "kde" | "gi_star" | "hdbscan" | "districts";

export interface HotspotLayerState {
  enabled: Record<HotspotLayerKey, boolean>;
  data: Partial<Record<HotspotLayerKey, HotspotFeatureCollection | null>>;
  loading: Partial<Record<HotspotLayerKey, boolean>>;
  errors: Partial<Record<HotspotLayerKey, string | null>>;
}

export const initialHotspotLayerState = (): HotspotLayerState => ({
  enabled: { kde: false, gi_star: false, hdbscan: false, districts: false },
  data: {},
  loading: {},
  errors: {},
});
