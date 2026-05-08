// src/components/map/SurveillanceMap.tsx
import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import type { CameraFilter } from "../../types/api";
import { matchesCameraFilter } from "./cameraFilter";

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
  filter?: CameraFilter;
  center?: L.LatLngExpression;
  zoom?: number;
}

// Recenter on initial dataset only — keyed on the unfiltered
// FeatureCollection reference so filter toggles don't yank the
// viewport back to the default extent.
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
  filter,
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

  // Apply the camera filter on the way to leaflet. We rebuild the
  // GeoJSON layer (via ``key``) on filter change so the markers
  // really disappear/reappear instead of relying on style hacks.
  const { displayedGeoJson, layerKey } = useMemo(() => {
    if (!enrichedGeoJson) {
      return { displayedGeoJson: null, layerKey: "empty" };
    }
    if (!filter) {
      return { displayedGeoJson: enrichedGeoJson, layerKey: "all" };
    }
    const features = enrichedGeoJson.features.filter((f) =>
      matchesCameraFilter(f, filter),
    );
    const fc: FeatureCollection<Geometry, GeoJsonProperties> = {
      type: "FeatureCollection",
      features,
    };
    const sig = JSON.stringify({
      ops: filter.operators,
      pr: filter.privacy,
      sn: filter.sensitivity,
      n: features.length,
    });
    return { displayedGeoJson: fc, layerKey: sig };
  }, [enrichedGeoJson, filter]);

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

      {displayedGeoJson && (
        <GeoJSON
          key={layerKey}
          data={displayedGeoJson}
          onEachFeature={onEachEnrichedFeature}
          pointToLayer={(_feature, latlng) => {
            return L.marker(latlng, { icon: cameraIcon });
          }}
        />
      )}
      {enrichedGeoJson && <RecenterAutomatically geoJson={enrichedGeoJson} />}
    </MapContainer>
  );
};

export default SurveillanceMap;
