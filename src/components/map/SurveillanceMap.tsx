// src/components/map/SurveillanceMap.tsx
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import type { RouteProperties } from "../../types/api";

// Fix for default marker icons not showing up
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface SurveillanceMapProps {
  enrichedGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null;
  routeGeoJson: FeatureCollection<Geometry, RouteProperties> | null; // Use RouteProperties here
  showEnrichedLayer: boolean;
  showRouteLayer: boolean;
  center?: L.LatLngExpression;
  zoom?: number;
}

// Component to recenter map when GeoJSON data changes
const RecenterAutomatically: React.FC<{
  geoJson: FeatureCollection<Geometry, GeoJsonProperties> | null;
}> = ({ geoJson }) => {
  const map = useMap();
  useEffect(() => {
    if (geoJson && geoJson.features.length > 0) {
      const bounds = L.geoJSON(geoJson).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geoJson, map]);
  return null;
};

const SurveillanceMap: React.FC<SurveillanceMapProps> = ({
  enrichedGeoJson,
  routeGeoJson,
  showEnrichedLayer,
  showRouteLayer,
  center = [0, 0], // Default center
  zoom = 2, // Default zoom
}) => {
  const geoJsonRefs = useRef<{ [key: string]: L.GeoJSON | null }>({});

  // Custom style for enriched points (e.g., cameras)
  const onEachEnrichedFeature = (feature: Feature, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(feature.properties.name as string); // Cast to string
    }
  };

  // Custom style for route GeoJSON (color-coded)
  const getRouteStyle = (feature: Feature<Geometry, RouteProperties>) => {
    // Ensure properties exist and risk_score is a number
    const riskScore = feature.properties?.risk_score ?? 0;
    return {
      color: riskScore > 0.5 ? "red" : "green", // Example: green for safe, red for risky
      weight: 5,
      opacity: 0.7,
    };
  };

  // Get initial center and zoom from GeoJSON if available
  const initialCenter: L.LatLngExpression = center;
  const initialZoom: number = zoom;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      className="h-[600px] w-full rounded-lg shadow-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showEnrichedLayer && enrichedGeoJson && (
        <GeoJSON
          key="enriched-layer"
          data={enrichedGeoJson}
          onEachFeature={onEachEnrichedFeature}
          pointToLayer={(_feature, latlng) => {
            // Renamed to _feature
            // Customize marker for points if desired (e.g., custom icon)
            return L.marker(latlng);
          }}
          ref={(el) => {
            geoJsonRefs.current.enriched = el;
          }}
        />
      )}

      {showRouteLayer && routeGeoJson && (
        <GeoJSON
          key="route-layer"
          data={routeGeoJson}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={getRouteStyle as any} // Cast to any to satisfy Leaflet's less strict StyleFunction type
          ref={(el) => {
            geoJsonRefs.current.route = el;
          }}
        />
      )}

      {(showEnrichedLayer && enrichedGeoJson) ||
      (showRouteLayer && routeGeoJson) ? (
        <RecenterAutomatically
          geoJson={
            showEnrichedLayer && enrichedGeoJson
              ? enrichedGeoJson
              : (routeGeoJson as FeatureCollection<Geometry, GeoJsonProperties>)
          }
        />
      ) : null}
    </MapContainer>
  );
};

export default SurveillanceMap;
