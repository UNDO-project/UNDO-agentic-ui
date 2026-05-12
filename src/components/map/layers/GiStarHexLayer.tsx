// src/components/map/layers/GiStarHexLayer.tsx
//
// Renders the Getis-Ord Gi* hex grid (``<city>_gi_star.geojson``).
// Each hex carries a ``category`` ∈ {hot_99, hot_95, not_significant,
// cold_95, cold_99}. We colour by category — *not* by raw z-score —
// because the journalistic claim is "this hex is statistically hot",
// not "this hex has a z-score of 3.7"; the FDR-adjusted classification
// is the load-bearing decision the layer encodes.

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import type { HotspotFeatureCollection } from "../../../api/outputs";

interface GiStarHexLayerProps {
  data: HotspotFeatureCollection;
}

// Same hue ramp ArcGIS/QGIS users expect for "Hot Spot Analysis":
// red for hot, blue for cold, grey for not-significant. Two intensities
// each side so the 99% confidence hexes pop visually above the 95%.
const CATEGORY_STYLE: Record<string, PathOptions> = {
  hot_99: {
    color: "#7f0000",
    weight: 1,
    fillColor: "#d73027",
    fillOpacity: 0.65,
  },
  hot_95: {
    color: "#d73027",
    weight: 1,
    fillColor: "#fc8d59",
    fillOpacity: 0.5,
  },
  not_significant: {
    color: "#999999",
    weight: 0.5,
    fillColor: "#dddddd",
    fillOpacity: 0.15,
  },
  cold_95: {
    color: "#4575b4",
    weight: 1,
    fillColor: "#91bfdb",
    fillOpacity: 0.5,
  },
  cold_99: {
    color: "#08306b",
    weight: 1,
    fillColor: "#4575b4",
    fillOpacity: 0.65,
  },
};

const FALLBACK_STYLE: PathOptions = CATEGORY_STYLE.not_significant;

const GiStarHexLayer: React.FC<GiStarHexLayerProps> = ({ data }) => {
  const styleFeature = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const category = String(feature?.properties?.category ?? "");
    return CATEGORY_STYLE[category] ?? FALLBACK_STYLE;
  };

  const onEachFeature = (
    feature: Feature<Geometry, GeoJsonProperties>,
    layer: Layer,
  ) => {
    const props = feature.properties ?? {};
    const z =
      typeof props.gi_star_z === "number" ? props.gi_star_z.toFixed(2) : "—";
    const p =
      typeof props.p_fdr === "number" ? props.p_fdr.toExponential(2) : "—";
    layer.bindTooltip(
      `<div style="min-width:160px;">
        <b>Gi* hex</b><br/>
        Cameras: ${props.count ?? "—"}<br/>
        z-score: ${z}<br/>
        p (FDR): ${p}<br/>
        Class: ${props.category ?? "—"}
      </div>`,
      { sticky: true },
    );
  };

  return (
    <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />
  );
};

export default GiStarHexLayer;
