// src/api/outputs.ts
import api from "./axios";
import type { CityOutputsResponse } from "../types/api";

export const getCityOutputs = async (
  city: string,
): Promise<CityOutputsResponse> => {
  const response = await api.get<CityOutputsResponse>(`/outputs/${city}/list`);
  return response.data;
};

// Generic function to download any file by its path
export const downloadFile = async (filePath: string): Promise<Blob> => {
  const response = await api.get(filePath, { responseType: "blob" });
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

export const getRouteGeoJson = async (city: string): Promise<Blob> => {
  // Assuming route geojson has a specific name or can be fetched via a dedicated endpoint
  // Based on CLI_BACKEND_NOTES, it's route_<hash>.geojson which implies we might need the hash.
  // For now, let's assume a generic way or rely on downloadFile with the specific path from getCityOutputs
  // For testing, if the backend has a direct way to get *the* route geojson for a city, we'd use that.
  // Let's create a placeholder for now.
  const response = await api.get(`/outputs/${city}/route`, {
    params: { format: "geojson" },
    responseType: "blob",
  });
  return response.data;
};
