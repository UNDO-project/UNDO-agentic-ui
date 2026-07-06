// src/components/dashboard/stats/DistrictSummaryCallout.tsx
//
// Headline citywide numbers for the administrative-district layer
// (police-cameras-per-district, Frontend #53 / Backend #135). Sits on the
// Statistics tab next to the density-metrics callout. The eye lands on
// the citywide police total first — the paper's class-analysis payoff —
// with the citywide untagged share as the data-quality caveat right
// beside it.
//
// Like ``DensityMetricsCallout`` the component owns its own fetch
// lifecycle and degrades to a captioned placeholder when the district
// layer wasn't run for this city (the summary rides the districts
// GeoJSON, so a 404 there is the "unavailable" signal).

import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Paper, Skeleton, Typography } from "@mui/material";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DownloadIcon from "@mui/icons-material/Download";
import {
  getDistrictsSummary,
  type DistrictSummary,
} from "../../../api/outputs";

interface DistrictSummaryCalloutProps {
  city: string;
  /** Download handler for ``<city>_districts.csv`` (reuses the blob path). */
  onDownloadCsv: (fileName: string) => void;
}

const formatShare = (value: number | undefined | null): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
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

const DistrictSummaryCallout: React.FC<DistrictSummaryCalloutProps> = ({
  city,
  onDownloadCsv,
}) => {
  const [summary, setSummary] = useState<DistrictSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const data = await getDistrictsSummary(city);
      setSummary(data);
    } catch (err) {
      // 404 (layer not run) or a missing summary member is the expected
      // fallback — surface it as "unavailable" rather than an error.
      console.warn("District summary unavailable:", err);
      setSummary(null);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  if (unavailable || !summary) {
    return (
      <Paper sx={{ p: 3, mb: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          District aggregation not available for this run.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Re-run with the District aggregation toggle enabled to classify
          cameras by operator across administrative districts.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <MetricTile
          testId="district-police-total"
          icon={<LocalPoliceIcon fontSize="large" />}
          value={String(summary.police_count)}
          caption="Police-operated cameras"
          bg="rgba(217, 72, 1, 0.08)"
          fg="#d94801"
        />
        <MetricTile
          testId="district-untagged-share"
          icon={<HelpOutlineIcon fontSize="large" />}
          value={formatShare(summary.untagged_share)}
          caption="Citywide untagged share"
          bg="rgba(96, 125, 139, 0.10)"
          fg="#455a64"
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1.5, textAlign: "center" }}
      >
        {summary.districts} districts · {summary.total_cameras} cameras (
        {summary.unassigned} outside any district).
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => onDownloadCsv(`${city}_districts.csv`)}
        >
          Download CSV
        </Button>
      </Box>
    </Paper>
  );
};

export default DistrictSummaryCallout;
