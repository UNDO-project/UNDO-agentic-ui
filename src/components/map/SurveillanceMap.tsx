// src/components/map/SurveillanceMap.tsx
import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import type { MapCameraFilter } from "../../types/api";
import { matchesMapCameraFilter } from "./cameraFilter";
import KDEContourLayer from "./layers/KDEContourLayer";
import GiStarHexLayer from "./layers/GiStarHexLayer";
import HDBSCANPolygonLayer from "./layers/HDBSCANPolygonLayer";
import DistrictChoroplethLayer from "./layers/DistrictChoroplethLayer";
import { computeDistrictBands } from "./layers/districtScale";
import HotspotLegends from "./layers/HotspotLegend";
import type { HotspotLayerState } from "./layers/hotspotLayerState";

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
  filter?: MapCameraFilter;
  center?: L.LatLngExpression;
  zoom?: number;
  /**
   * Optional hotspot overlay state. When present, the corresponding
   * GeoJSON layers are rendered as siblings of the camera markers and
   * each enabled layer also flips on its inline legend in the
   * bottom-left corner. The map fits its own bounds via the camera
   * GeoJSON — hotspot layers don't trigger a recenter, so toggling a
   * hex grid on a city the user is panned into doesn't yank the
   * viewport back.
   */
  hotspotLayers?: HotspotLayerState;
  /**
   * Optional child rendered as a sibling of the MapContainer, used by
   * the dashboard to mount the floating HotspotLayerControl panel
   * over the map. Kept generic so additional floating controls can
   * be added without re-threading more props.
   */
  controlsOverlay?: React.ReactNode;
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
  hotspotLayers,
  controlsOverlay,
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
      matchesMapCameraFilter(f, filter),
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

  // Hotspot overlay GeoJSON is re-keyed per layer so toggling one
  // off-then-on cleanly drops the Leaflet sources rather than mutating
  // them in place (which used to leak DOM nodes on rapid retoggles).
  const kdeData = hotspotLayers?.enabled.kde ? hotspotLayers.data.kde : null;
  const giData = hotspotLayers?.enabled.gi_star
    ? hotspotLayers.data.gi_star
    : null;
  const hdbData = hotspotLayers?.enabled.hdbscan
    ? hotspotLayers.data.hdbscan
    : null;
  const districtData = hotspotLayers?.enabled.districts
    ? hotspotLayers.data.districts
    : null;
  // Quantile bands derived from the loaded districts — shared by the
  // choropleth fill and its legend so both classify identically.
  const districtBands = useMemo(
    () => computeDistrictBands(districtData),
    [districtData],
  );

  return (
    <Box sx={{ position: "relative" }}>
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

        {/* Order matters: districts at the very bottom (large area fills
            shouldn't steal hovers), then KDE, Gi* over it, HDBSCAN top —
            denser/more-specific layers paint last so hovers hit them
            first. */}
        {districtData && (
          <DistrictChoroplethLayer
            key="district-layer"
            data={districtData}
            bands={districtBands}
          />
        )}
        {kdeData && <KDEContourLayer key="kde-layer" data={kdeData} />}
        {giData && <GiStarHexLayer key="gi-layer" data={giData} />}
        {hdbData && <HDBSCANPolygonLayer key="hdb-layer" data={hdbData} />}

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
      {controlsOverlay}
      {hotspotLayers && (
        <HotspotLegends
          showKDE={!!hotspotLayers.enabled.kde && !!hotspotLayers.data.kde}
          showGiStar={
            !!hotspotLayers.enabled.gi_star && !!hotspotLayers.data.gi_star
          }
          showHDBSCAN={
            !!hotspotLayers.enabled.hdbscan && !!hotspotLayers.data.hdbscan
          }
          showDistricts={
            !!hotspotLayers.enabled.districts && !!hotspotLayers.data.districts
          }
          districtBands={districtBands}
        />
      )}
    </Box>
  );
};

export default SurveillanceMap;
