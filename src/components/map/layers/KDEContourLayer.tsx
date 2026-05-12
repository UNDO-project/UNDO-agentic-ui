// src/components/map/layers/KDEContourLayer.tsx
//
// Renders the planar-KDE density contour polygons emitted by the backend
// (``<city>_density.geojson``). The artifact carries four nested
// polygon bands at the 50/75/90/95 percentiles; each band is shaded
// progressively darker so the densest cores read first.
//
// Style props live with the component (not a global CSS file) so swapping
// the colour ramp is a one-file change.

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import type { HotspotFeatureCollection } from "../../../api/outputs";

interface KDEContourLayerProps {
  data: HotspotFeatureCollection;
}

// Increasing opacity = denser percentile. Same blue-purple hue so the
// eye reads the bands as one surface, not four unrelated polygons.
const PERCENTILE_STYLE: Record<number, PathOptions> = {
  50: { color: "#5b6bb0", weight: 1, fillColor: "#7986cb", fillOpacity: 0.18 },
  75: { color: "#3949ab", weight: 1, fillColor: "#5c6bc0", fillOpacity: 0.3 },
  90: { color: "#1a237e", weight: 1, fillColor: "#3949ab", fillOpacity: 0.45 },
  95: { color: "#1a237e", weight: 1.5, fillColor: "#1a237e", fillOpacity: 0.6 },
};

const FALLBACK_STYLE: PathOptions = {
  color: "#3949ab",
  weight: 1,
  fillColor: "#5c6bc0",
  fillOpacity: 0.3,
};

const KDEContourLayer: React.FC<KDEContourLayerProps> = ({ data }) => {
  const styleFeature = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const pct = Number(feature?.properties?.percentile);
    return PERCENTILE_STYLE[pct] ?? FALLBACK_STYLE;
  };

  const onEachFeature = (
    feature: Feature<Geometry, GeoJsonProperties>,
    layer: Layer,
  ) => {
    const props = feature.properties ?? {};
    const pct = props.percentile ?? "—";
    const density =
      typeof props.density === "number" ? props.density.toExponential(2) : "—";
    layer.bindTooltip(
      `<div style="min-width:140px;">
        <b>KDE density</b><br/>
        Percentile: ${pct}<br/>
        Density: ${density}
      </div>`,
      { sticky: true },
    );
  };

  return (
    <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />
  );
};

export default KDEContourLayer;
