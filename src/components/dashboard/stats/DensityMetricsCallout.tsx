// src/components/dashboard/stats/DensityMetricsCallout.tsx
//
// Headline density-metric tile shown above the fold on the Statistics
// tab. The eye lands on ``cameras_per_road_km`` first — it's the
// citable cross-city figure (Stanford *Surveilling Surveillance*,
// 2021) journalists and policy-makers quote. ``cameras_per_km²`` sits
// next to it as the sanity-check denominator a reader who knows the
// older methodology may already have in mind.
//
// The component owns its own fetch lifecycle (Storybook-friendly,
// fewer props to thread through ``Dashboard.tsx``) but renders nothing
// while the metric file is missing — a graceful no-op so the
// Statistics tab on a BASIC run looks the same as it did before
// v2.4.0.

import React, { useCallback, useEffect, useState } from "react";
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import { getDensityMetrics, type DensityMetrics } from "../../../api/outputs";

interface DensityMetricsCalloutProps {
  city: string;
}

/**
 * Format a positive float with sensible precision for the callout.
 *
 * The metric ranges across two orders of magnitude across cities
 * (Lund ≈ 0.05, Manhattan ≈ 5+), so a fixed-decimal format alone
 * loses signal at one end or the other. Three significant figures
 * splits the difference, and we drop trailing zeros for readability.
 */
const formatMetric = (value: number | undefined | null): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) return "0";
  return Number(value.toPrecision(3)).toString();
};

const MetricTile: React.FC<{
  icon: React.ReactNode;
  value: string;
  caption: string;
  bg: string;
  fg: string;
  testId: string;
}> = ({ icon, value, caption, bg, fg, testId }) => (
  <Box
    data-testid={testId}
    sx={{
      flex: 1,
      minWidth: 0,
      p: 3,
      borderRadius: 2,
      bgcolor: bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Box sx={{ color: fg, mb: 1 }}>{icon}</Box>
    <Typography
      variant="h3"
      sx={{
        fontWeight: 700,
        color: fg,
        lineHeight: 1.1,
        // Long numbers shouldn't shove the sibling tile around.
        wordBreak: "break-word",
      }}
    >
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {caption}
    </Typography>
  </Box>
);

const DensityMetricsCallout: React.FC<DensityMetricsCalloutProps> = ({
  city,
}) => {
  const [metrics, setMetrics] = useState<DensityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  // ``unavailable`` is distinct from "loading=false, metrics=null":
  // the latter is the initial render before the fetch resolves; the
  // former means we *tried* and the file isn't there. Drives the
  // captioned-placeholder branch below.
  const [unavailable, setUnavailable] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const data = await getDensityMetrics(city);
      setMetrics(data);
    } catch (err) {
      // 404 (artifact missing for this run) is the expected fallback
      // path — surface it as "unavailable" rather than as an error
      // banner. Other failures (network, 500) get the same treatment
      // here; the dashboard's snackbar covers loud errors elsewhere
      // and we don't want to double-warn for a missing JSON file.
      console.warn("Density metrics unavailable:", err);
      setMetrics(null);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Skeleton variant="rounded" height={140} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={140} sx={{ flex: 1 }} />
        </Box>
      </Paper>
    );
  }

  if (unavailable || !metrics) {
    return (
      <Paper sx={{ p: 3, mb: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Density metrics not available for this run.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Re-run with the density-metrics toggle enabled to compute cameras per
          road-km.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <MetricTile
          testId="density-cameras-per-road-km"
          icon={<RouteIcon fontSize="large" />}
          value={formatMetric(metrics.cameras_per_road_km)}
          caption="Cameras per road-km"
          bg="rgba(63, 81, 181, 0.08)"
          fg="#3f51b5"
        />
        <MetricTile
          testId="density-cameras-per-km2"
          icon={<SquareFootIcon fontSize="large" />}
          value={formatMetric(metrics.cameras_per_km2)}
          caption="Cameras per km²"
          bg="rgba(255, 152, 0, 0.08)"
          fg="#ef6c00"
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1.5, textAlign: "center" }}
      >
        Cameras per kilometre of pedestrian road in the analyzed area (
        {metrics.total_cameras} cameras over{" "}
        {formatMetric(metrics.total_road_km)} road-km;{" "}
        {formatMetric(metrics.area_km2)} km² hull).
      </Typography>
    </Paper>
  );
};

export default DensityMetricsCallout;
