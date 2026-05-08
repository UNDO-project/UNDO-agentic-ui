// src/api/outputs.ts
import api from "./axios";
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
