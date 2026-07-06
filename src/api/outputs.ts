// src/api/outputs.ts
import api from "./axios";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { CityOutputsResponse } from "../types/api";

export const getCityOutputs = async (
  city: string,
): Promise<CityOutputsResponse> => {
  const response = await api.get<CityOutputsResponse>(`/outputs/${city}/list`);
  return response.data;
};

// Generic function to download any file by filename and city
export const downloadFile = async (
  filename: string,
  city: string,
): Promise<Blob> => {
  const response = await api.get(`/outputs/file/${filename}`, {
    params: { city },
    responseType: "blob",
  });
  return response.data;
};

// Specific download functions for convenience (example)
export const getGeoJson = async (
  city: string,
  enriched: boolean = true,
): Promise<Blob> => {
  const response = await api.get(`/outputs/${city}/geojson`, {
    params: { enriched },
    responseType: "blob",
  });
  return response.data;
};

export const getMap = async (
  city: string,
  mapType: "heatmap" | "hotspots" | "route_map",
): Promise<Blob> => {
  const response = await api.get(`/outputs/${city}/map`, {
    params: { map_type: mapType },
    responseType: "blob",
  });
  return response.data;
};

export const getChart = async (
  city: string,
  chartType: "privacy" | "sensitivity",
): Promise<Blob> => {
  const response = await api.get(`/outputs/${city}/charts`, {
    params: { chart: chartType },
    responseType: "blob",
  });
  return response.data;
};

// Get the URL for embedding heatmap in iframe
export const getHeatmapUrl = (city: string): string => {
  return `/api/v1/outputs/${city}/map?map_type=heatmap`;
};

// Fetch the LLM-generated city report as raw markdown text.
// Returns null on 404 so callers can hide the Report tab gracefully.
export const getCityReport = async (city: string): Promise<string> => {
  const response = await api.get(`/outputs/${city}/report`, {
    responseType: "text",
    transformResponse: [(data) => data], // bypass axios JSON auto-parse
  });
  return response.data;
};

// Get the hotspots plot PNG image. Uses the dedicated ``/map`` route
// (Backend HF#5: serves ``<city>_hotspots.png``) so a future filename
// change on the backend is a one-line route edit, not a coordinated
// frontend release.
export const getHotspotsPlot = async (city: string): Promise<Blob> => {
  const response = await api.get(`/outputs/${city}/map`, {
    params: { map_type: "hotspots" },
    responseType: "blob",
  });
  return response.data;
};

//
// Each layer is shipped as its own GeoJSON artifact by the backend.
// The frontend layer-toggle in the dashboard map fetches them
// lazily on first activation. Returning a parsed ``FeatureCollection``
// (rather than a Blob) saves every layer component from re-parsing the
// payload and keeps the cache key surface narrow — same fetch helper
// in cache, same parsed object out.
//
// All four routes 404 cleanly when the underlying file is absent for
// this run (BASIC scenario, missing toggle, OSM had no data, etc.).
// Callers should treat the 404 as "layer not generated" and not as an
// error — see the helpers' usage in HotspotLayerControl.

export type HotspotFeatureCollection = FeatureCollection<
  Geometry,
  GeoJsonProperties
>;

/** Internal: tiny wrapper so the four named endpoints share one body. */
async function fetchHotspotGeoJson(
  city: string,
  leaf: string,
): Promise<HotspotFeatureCollection> {
  const response = await api.get<HotspotFeatureCollection>(
    `/outputs/${city}/${leaf}`,
  );
  return response.data;
}

/** KDE density contours, 50/75/90/95 percentile bands. */
export const getDensityGeoJson = (
  city: string,
): Promise<HotspotFeatureCollection> =>
  fetchHotspotGeoJson(city, "density.geojson");

/** Getis-Ord Gi* hex grid with z-scores + FDR-adjusted classification. */
export const getGiStarGeoJson = (
  city: string,
): Promise<HotspotFeatureCollection> =>
  fetchHotspotGeoJson(city, "gi_star.geojson");

/** HDBSCAN convex-hull polygons + cluster metadata. */
export const getHotspotPolygonsGeoJson = (
  city: string,
): Promise<HotspotFeatureCollection> =>
  fetchHotspotGeoJson(city, "hotspot_polygons.geojson");

/**
 * Administrative-district choropleth (``<city>_districts.geojson``) —
 * one polygon per district carrying ``police_count`` and the per-class
 * counts. The citywide totals ride as a top-level ``summary`` member on
 * the FeatureCollection (see ``getDistrictsSummary``).
 */
export const getDistrictsGeoJson = (
  city: string,
): Promise<HotspotFeatureCollection> =>
  fetchHotspotGeoJson(city, "districts.geojson");

/**
 * Citywide district summary, read from the ``summary`` member of the
 * districts GeoJSON so the callout needs no dedicated backend endpoint.
 * Fields mirror the backend ``aggregate_cameras_by_district`` summary.
 *
 * Rejects (404 or missing member) when the district layer wasn't run —
 * the callout treats that as "unavailable" rather than an error.
 */
export interface DistrictSummary {
  districts: number;
  total_cameras: number;
  cameras_in_districts: number;
  police_count: number;
  other_identified_count: number;
  untagged_count: number;
  unassigned: number;
  untagged_share: number;
}

export const getDistrictsSummary = async (
  city: string,
): Promise<DistrictSummary> => {
  const response = await api.get<{ summary?: DistrictSummary }>(
    `/outputs/${city}/districts.geojson`,
  );
  if (!response.data?.summary) {
    throw new Error("District summary missing from payload");
  }
  return response.data.summary;
};

/**
 * Headline density-metric JSON: cameras-per-road-km plus the
 * sanity-check denominators (total cameras / road-km / area km²).
 * Schema mirrors the backend's ``DensityMetrics`` dataclass — values
 * are rounded server-side so the UI doesn't need to.
 *
 * 404 when the artifact wasn't generated for the run (BASIC scenario
 * with the toggle off, or an OSMnx download failure). Callers should
 * treat the 404 as "metric unavailable" rather than an error — the
 * callout falls back to a captioned placeholder.
 */
export interface DensityMetrics {
  total_cameras: number;
  total_road_km: number;
  cameras_per_road_km: number;
  area_km2: number;
  cameras_per_km2: number;
  provenance: {
    city: string;
    country: string | null;
    network_type: string;
    graph_hash: string;
    area_source: string;
  };
}

export const getDensityMetrics = async (
  city: string,
): Promise<DensityMetrics> => {
  const response = await api.get<DensityMetrics>(
    `/outputs/${city}/density_metrics.json`,
  );
  return response.data;
};
