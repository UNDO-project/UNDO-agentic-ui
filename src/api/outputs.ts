// src/api/outputs.ts
import api from "./axios";
import type { CityOutputsResponse } from "../types/api";

export const getCityOutputs = async (
  city: string,
): Promise<CityOutputsResponse> => {
  const response = await api.get<CityOutputsResponse>(`/outputs/${city}/list`);
  return response.data;
};

// Download a file by filename and city using the correct API endpoint
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

// Get the hotspots plot PNG image
export const getHotspotsPlot = async (city: string): Promise<Blob> => {
  // Hotspots are generated as PNG files: {city}_enriched_hotspots.png
  const filename = `${city}_enriched_hotspots.png`;
  return downloadFile(filename, city);
};
