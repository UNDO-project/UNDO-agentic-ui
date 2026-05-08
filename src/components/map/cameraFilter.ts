// src/components/map/cameraFilter.ts
//
// Client-side filtering for the enriched-camera map (Frontend #3).
// The enriched GeoJSON already carries every property we need —
// ``operator``, ``public``, ``sensitive`` — so the filter is a pure
// predicate over feature properties; no backend round-trip per
// toggle.

import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { MapCameraFilter } from "../../types/api";

export const DEFAULT_CAMERA_FILTER: MapCameraFilter = {
  operators: [],
  privacy: { public: true, private: true, unknown: true },
  sensitivity: "all",
};

/**
 * Single-feature predicate. Mirrors the spec in Frontend #3: an
 * empty operator list means "no operator constraint", and the
 * privacy bucket is determined by the ``public`` boolean (true /
 * false / null|undefined → unknown).
 */
export function matchesMapCameraFilter(
  feature: Feature<Geometry, GeoJsonProperties>,
  filter: MapCameraFilter,
): boolean {
  const props = feature.properties ?? {};

  if (filter.operators.length > 0) {
    const op = typeof props.operator === "string" ? props.operator : null;
    if (!op || !filter.operators.includes(op)) return false;
  }

  const isPublic = props.public;
  if (isPublic === true && !filter.privacy.public) return false;
  if (isPublic === false && !filter.privacy.private) return false;
  if ((isPublic === null || isPublic === undefined) && !filter.privacy.unknown)
    return false;

  if (filter.sensitivity === "sensitive" && props.sensitive !== true)
    return false;
  if (filter.sensitivity === "non-sensitive" && props.sensitive === true)
    return false;

  return true;
}

/**
 * Distinct, sorted list of operator strings present in the loaded
 * GeoJSON. Falsy / non-string values are dropped so the multi-select
 * never offers ``""`` or ``null`` as a choice.
 */
export function extractOperators(
  features: Feature<Geometry, GeoJsonProperties>[],
): string[] {
  return extractStringProperty(features, "operator");
}

/**
 * Distinct, sorted list of ``surveillance_type`` strings present in the
 * loaded GeoJSON. Used by the routing-form camera filter selector
 * (Frontend #5) so the user picks from values the analyzer actually
 * produced for this city.
 */
export function extractSurveillanceTypes(
  features: Feature<Geometry, GeoJsonProperties>[],
): string[] {
  return extractStringProperty(features, "surveillance_type");
}

function extractStringProperty(
  features: Feature<Geometry, GeoJsonProperties>[],
  key: string,
): string[] {
  const seen = new Set<string>();
  for (const f of features) {
    const v = f.properties?.[key];
    if (typeof v === "string" && v.length > 0) seen.add(v);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}
