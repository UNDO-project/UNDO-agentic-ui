// src/components/map/layers/DistrictChoroplethLayer.tsx
//
// Renders the administrative-district aggregation (``<city>_districts.geojson``)
// as a sequential choropleth. Fill is driven by ``police_count`` — the
// paper's headline metric ("police cameras per district") — so the eye
// lands on the districts carrying the most police-operated cameras. The
// full per-class breakdown (total / police / other-identified / untagged
// + untagged-share) rides in the hover tooltip.
//
// This is the fourth entry in the hotspot-layer subsystem; it plugs into
// the same toggle/legend machinery as KDE / Gi* / HDBSCAN.

import React from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import type { HotspotFeatureCollection } from "../../../api/outputs";
import { districtColor, type DistrictBand } from "./districtScale";

interface DistrictChoroplethLayerProps {
  data: HotspotFeatureCollection;
  /**
   * Quantile bands derived from this layer's ``police_count`` values
   * (see ``districtScale``). Computed once in ``SurveillanceMap`` and
   * shared with the legend so fill and swatches agree.
   */
  bands: DistrictBand[];
}

const BASE_STYLE: PathOptions = {
  color: "#7f2704",
  weight: 1,
  fillOpacity: 0.6,
};

const DistrictChoroplethLayer: React.FC<DistrictChoroplethLayerProps> = ({
  data,
  bands,
}) => {
  const styleFeature = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const police = Number(feature?.properties?.police_count);
    return { ...BASE_STYLE, fillColor: districtColor(police, bands) };
  };

  const onEachFeature = (
    feature: Feature<Geometry, GeoJsonProperties>,
    layer: Layer,
  ) => {
    const props = feature.properties ?? {};
    const share =
      typeof props.untagged_share === "number"
        ? `${(props.untagged_share * 100).toFixed(1)}%`
        : "—";
    layer.bindTooltip(
      `<div style="min-width:180px;">
        <b>${props.name ?? "—"}</b><br/>
        Total cameras: ${props.total_cameras ?? "—"}<br/>
        Police: ${props.police_count ?? "—"}<br/>
        Other identified: ${props.other_identified_count ?? "—"}<br/>
        Untagged: ${props.untagged_count ?? "—"}<br/>
        Untagged share: ${share}
      </div>`,
      { sticky: true },
    );
  };

  return (
    <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />
  );
};

export default DistrictChoroplethLayer;
