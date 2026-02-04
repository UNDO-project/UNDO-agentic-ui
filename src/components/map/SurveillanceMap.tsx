// src/components/map/SurveillanceMap.tsx
import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";

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
  center = [0, 0], // Default center
  zoom = 2, // Default zoom
}) => {
  // Custom camera icon
  const cameraIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Custom style for enriched points (e.g., cameras)
  const onEachEnrichedFeature = (feature: Feature, layer: L.Layer) => {
    if (feature.properties) {
      const props = feature.properties;
      let popupContent = "<div style='min-width: 200px;'>";

      // Display all available properties
      if (props.name) popupContent += `<b>${props.name}</b><br/>`;
      if (props.type) popupContent += `Type: ${props.type}<br/>`;
      if (props.description)
        popupContent += `Description: ${props.description}<br/>`;

      popupContent += "</div>";
      layer.bindPopup(popupContent);
    }
  };

  // Get initial center and zoom from GeoJSON if available
  const initialCenter: L.LatLngExpression = center;
  const initialZoom: number = zoom;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: "700px", width: "100%" }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {enrichedGeoJson && (
        <>
          <GeoJSON
            key="enriched-layer"
            data={enrichedGeoJson}
            onEachFeature={onEachEnrichedFeature}
            pointToLayer={(_feature, latlng) => {
              return L.marker(latlng, { icon: cameraIcon });
            }}
          />
          <RecenterAutomatically geoJson={enrichedGeoJson} />
        </>
      )}
    </MapContainer>
  );
};

export default SurveillanceMap;
