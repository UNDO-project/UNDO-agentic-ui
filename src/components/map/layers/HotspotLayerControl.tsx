// src/components/map/layers/HotspotLayerControl.tsx
//
// Floating top-right panel that toggles the three hotspot overlays
// (KDE / Gi* / HDBSCAN) on the dashboard map. Each layer's GeoJSON is
// fetched lazily the first time the checkbox flips on, cached for the
// session by ``(city, taskId)``, and discarded when the taskId changes
// (i.e. a fresh pipeline run for the same city).
//
// The panel is rendered as a sibling absolute-positioned MUI Paper —
// not a Leaflet ``Control`` — so it can use the app's theme + buttons
// and is React-state-friendly. ``pointerEvents`` on the wrapper is
// scoped so map drag/zoom outside the panel isn't blocked.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LayersIcon from "@mui/icons-material/Layers";
import {
  getDensityGeoJson,
  getDistrictsGeoJson,
  getGiStarGeoJson,
  getHotspotPolygonsGeoJson,
  type HotspotFeatureCollection,
} from "../../../api/outputs";
import type { HotspotLayerKey, HotspotLayerState } from "./hotspotLayerState";

interface HotspotLayerControlProps {
  city: string;
  /**
   * Identifier that changes between runs (typically the pipeline
   * ``taskId``). Cache keys include this so re-running for the same
   * city refetches fresh GeoJSON rather than serving the stale layer
   * from the previous task.
   */
  cacheKey: string;
  state: HotspotLayerState;
  onChange: (next: HotspotLayerState) => void;
}

const LAYER_LABELS: Record<HotspotLayerKey, string> = {
  kde: "KDE density contours",
  gi_star: "Gi* hot/cold hexes",
  hdbscan: "HDBSCAN polygons",
  districts: "Districts (police cameras)",
};

const LAYER_FETCHERS: Record<
  HotspotLayerKey,
  (city: string) => Promise<HotspotFeatureCollection>
> = {
  kde: getDensityGeoJson,
  gi_star: getGiStarGeoJson,
  hdbscan: getHotspotPolygonsGeoJson,
  districts: getDistrictsGeoJson,
};

// Empty-state hints stay with the control (where the user sees them)
// rather than living in the layer component, which never renders an
// "empty" view — an empty FeatureCollection just draws nothing.
const EMPTY_HINTS: Record<HotspotLayerKey, string> = {
  kde: "No density contours — re-run with --heatmap.",
  gi_star: "No Gi* layer — re-run with --gi-star.",
  hdbscan: "No clusters detected — try --hotspots or a denser city.",
  districts: "No districts — re-run with --district-aggregation.",
};

const HotspotLayerControl: React.FC<HotspotLayerControlProps> = ({
  city,
  cacheKey,
  state,
  onChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Reset cached layer data when the cacheKey (taskId) changes so a
  // fresh pipeline run never serves the previous task's layers.
  useEffect(() => {
    onChange({
      ...state,
      data: {},
      loading: {},
      errors: {},
    });
    // We intentionally exclude state/onChange — this effect must fire
    // *only* on cacheKey changes, otherwise it would loop on every
    // toggle (which updates ``state`` and would re-clear the cache).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const fetchLayer = useCallback(
    async (key: HotspotLayerKey, current: HotspotLayerState) => {
      if (current.data[key]) return; // cached for this taskId
      const loadingPatch = {
        ...current,
        loading: { ...current.loading, [key]: true },
        errors: { ...current.errors, [key]: null },
      };
      onChange(loadingPatch);
      try {
        const fc = await LAYER_FETCHERS[key](city);
        onChange({
          ...loadingPatch,
          data: { ...loadingPatch.data, [key]: fc },
          loading: { ...loadingPatch.loading, [key]: false },
        });
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to load layer";
        onChange({
          ...loadingPatch,
          loading: { ...loadingPatch.loading, [key]: false },
          errors: { ...loadingPatch.errors, [key]: msg },
        });
      }
    },
    [city, onChange],
  );

  const handleToggle = useCallback(
    (key: HotspotLayerKey) => {
      const wasEnabled = state.enabled[key];
      const next: HotspotLayerState = {
        ...state,
        enabled: { ...state.enabled, [key]: !wasEnabled },
      };
      onChange(next);
      if (!wasEnabled) {
        // Newly enabled — kick off the fetch using the *post-toggle*
        // state so the loading flag lands on the right object.
        fetchLayer(key, next);
      }
    },
    [state, onChange, fetchLayer],
  );

  const rows = useMemo(
    () =>
      (Object.keys(LAYER_LABELS) as HotspotLayerKey[]).map((key) => ({
        key,
        label: LAYER_LABELS[key],
        enabled: state.enabled[key],
        loading: !!state.loading[key],
        error: state.errors[key],
        hasData: !!state.data[key],
        empty: state.data[key] && state.data[key]?.features?.length === 0,
      })),
    [state],
  );

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        minWidth: 240,
        bgcolor: "rgba(255,255,255,0.95)",
        pointerEvents: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.75,
          borderBottom: collapsed ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LayersIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Hotspot layers
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand layer panel" : "Collapse layer panel"}
        >
          {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Box>
      {!collapsed && (
        <Stack sx={{ px: 1.5, py: 1 }} spacing={0.5}>
          {rows.map((row) => (
            <Box key={row.key}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={row.enabled}
                    onChange={() => handleToggle(row.key)}
                  />
                }
                label={
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Typography variant="body2">{row.label}</Typography>
                    {row.loading && <CircularProgress size={12} />}
                  </Box>
                }
                sx={{ m: 0 }}
              />
              {row.enabled && row.error && (
                <Tooltip title={row.error}>
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ display: "block", pl: 4 }}
                  >
                    Layer unavailable for this run.
                  </Typography>
                </Tooltip>
              )}
              {row.enabled && row.empty && !row.loading && !row.error && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", pl: 4 }}
                >
                  {EMPTY_HINTS[row.key]}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default HotspotLayerControl;
