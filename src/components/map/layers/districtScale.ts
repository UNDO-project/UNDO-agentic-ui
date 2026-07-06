// src/components/map/layers/districtScale.ts
//
// Data-driven color classification for the district choropleth. Fixed
// absolute bands don't work here because the same metric (police cameras
// per district) spans wildly different ranges depending on the OSM
// ``admin_level``: 5 coarse stadsområden all carry 10+ police cameras
// (every one saturates the top of a fixed ramp → one flat color), while
// 121 fine delområden mostly carry 0–2. Quantile classification derives
// the breaks from the values actually present in the layer, so the map
// always shows contrast and the legend reports the real ranges.
//
// Shared by ``DistrictChoroplethLayer`` (fill) and ``HotspotLegend``
// (swatches) so both read the same breaks — computed once in
// ``SurveillanceMap`` and threaded to each.

import type { HotspotFeatureCollection } from "../../../api/outputs";

// ColorBrewer Oranges, 5-class, light → dark.
export const DISTRICT_RAMP = [
  "#feedde",
  "#fdbe85",
  "#fd8d3c",
  "#e6550d",
  "#a63603",
] as const;

/** One classified band: a color and the inclusive value range it covers. */
export interface DistrictBand {
  color: string;
  min: number;
  max: number;
}

/** Linear-interpolated quantile of a pre-sorted ascending array. */
const quantile = (sorted: number[], q: number): number => {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
};

/**
 * Classify the districts' ``police_count`` into up to five quantile bands.
 * Returns ``[]`` for an empty/absent layer; a single band when every
 * district shares one value (nothing to differentiate).
 */
export const computeDistrictBands = (
  fc: HotspotFeatureCollection | null | undefined,
): DistrictBand[] => {
  const values = (fc?.features ?? [])
    .map((f) => Number(f.properties?.police_count))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);

  if (values.length === 0) return [];

  const min = values[0];
  const max = values[values.length - 1];
  if (min === max) {
    // No spread — a single honest band (grey when there are no police
    // cameras anywhere, otherwise the ramp's darkest).
    return [
      {
        color: min > 0 ? DISTRICT_RAMP[DISTRICT_RAMP.length - 1] : "#eeeeee",
        min,
        max,
      },
    ];
  }

  const distinct = new Set(values).size;
  const nClasses = Math.min(DISTRICT_RAMP.length, distinct);
  const edges = [min];
  for (let i = 1; i < nClasses; i++) {
    edges.push(quantile(values, i / nClasses));
  }
  edges.push(max);

  const bands: DistrictBand[] = [];
  for (let i = 0; i < nClasses; i++) {
    bands.push({ color: DISTRICT_RAMP[i], min: edges[i], max: edges[i + 1] });
  }
  return bands;
};

/** Pick the band color for a district's ``police_count``. */
export const districtColor = (
  policeCount: number,
  bands: DistrictBand[],
): string => {
  if (!bands.length) return "#eeeeee";
  if (!Number.isFinite(policeCount)) return bands[0].color;
  for (const b of bands) {
    if (policeCount <= b.max) return b.color;
  }
  return bands[bands.length - 1].color;
};

/** Legend row label for a band, e.g. ``"58 – 83"`` or ``"12"`` for a point band. */
export const bandLabel = (band: DistrictBand): string => {
  const lo = Math.round(band.min);
  const hi = Math.round(band.max);
  return lo === hi ? `${lo}` : `${lo} – ${hi}`;
};
