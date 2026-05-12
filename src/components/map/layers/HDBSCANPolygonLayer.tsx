// src/components/map/layers/HDBSCANPolygonLayer.tsx
//
// Renders the HDBSCAN convex hulls (``<city>_hotspot_polygons.geojson``).
// Fill opacity is driven by cluster ``persistence`` (HDBSCAN's
// "how stable is this cluster across density thresholds" score) —
// flashier hulls = more confident clusters, so an unstable noise
// fragment doesn't visually dominate a load-bearing downtown blob.

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import type { HotspotFeatureCollection } from "../../../api/outputs";

interface HDBSCANPolygonLayerProps {
  data: HotspotFeatureCollection;
}

const BASE_STYLE: PathOptions = {
  color: "#2e7d32",
  weight: 1.5,
  fillColor: "#66bb6a",
};

const HDBSCANPolygonLayer: React.FC<HDBSCANPolygonLayerProps> = ({ data }) => {
  const styleFeature = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const persistence = Number(feature?.properties?.persistence);
    // HDBSCAN persistence sits in roughly [0, 1] for stable urban
    // clusters. Map to a 0.2-0.6 alpha so even the weakest hull is
    // visible without the strongest fully occluding the basemap.
    const alpha = Number.isFinite(persistence)
      ? Math.max(0.2, Math.min(0.6, 0.2 + persistence * 0.5))
      : 0.35;
    return { ...BASE_STYLE, fillOpacity: alpha };
  };

  const onEachFeature = (
    feature: Feature<Geometry, GeoJsonProperties>,
    layer: Layer,
  ) => {
    const props = feature.properties ?? {};
    const persistence =
      typeof props.persistence === "number"
        ? props.persistence.toFixed(3)
        : "—";
    layer.bindTooltip(
      `<div style="min-width:160px;">
        <b>HDBSCAN cluster</b><br/>
        ID: ${props.cluster_id ?? "—"}<br/>
        Cameras: ${props.count ?? "—"}<br/>
        Persistence: ${persistence}
      </div>`,
      { sticky: true },
    );
  };

  return (
    <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />
  );
};

export default HDBSCANPolygonLayer;
