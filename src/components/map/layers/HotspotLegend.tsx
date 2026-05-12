// src/components/map/layers/HotspotLegend.tsx
//
// One legend per enabled hotspot overlay, stacked bottom-left over the
// map. Renders as a sibling DOM node (not a Leaflet control) so it
// inherits MUI theming and isn't subject to Leaflet's z-index dance.
// The legend's visibility tracks the layer's: a layer toggled off
// removes the corresponding legend block.

import React from "react";
import { Box, Stack, Typography } from "@mui/material";

interface LegendBoxProps {
  title: string;
  rows: Array<{ swatch: string; label: string; outline?: string }>;
}

const LegendBox: React.FC<LegendBoxProps> = ({ title, rows }) => (
  <Box
    sx={{
      bgcolor: "rgba(255,255,255,0.9)",
      borderRadius: 1,
      px: 1.5,
      py: 1,
      boxShadow: 1,
      minWidth: 140,
      fontSize: 12,
      pointerEvents: "auto",
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
    >
      {title}
    </Typography>
    <Stack spacing={0.3}>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              bgcolor: row.swatch,
              border: row.outline
                ? `1px solid ${row.outline}`
                : "1px solid #999",
              borderRadius: 0.5,
            }}
          />
          <Typography variant="caption">{row.label}</Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

interface HotspotLegendsProps {
  showKDE: boolean;
  showGiStar: boolean;
  showHDBSCAN: boolean;
}

const HotspotLegends: React.FC<HotspotLegendsProps> = ({
  showKDE,
  showGiStar,
  showHDBSCAN,
}) => {
  if (!showKDE && !showGiStar && !showHDBSCAN) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      {showKDE && (
        <LegendBox
          title="KDE density"
          rows={[
            { swatch: "#1a237e", label: "≥ 95th pct" },
            { swatch: "#3949ab", label: "90–95" },
            { swatch: "#5c6bc0", label: "75–90" },
            { swatch: "#7986cb", label: "50–75" },
          ]}
        />
      )}
      {showGiStar && (
        <LegendBox
          title="Gi* hot/cold"
          rows={[
            { swatch: "#d73027", label: "Hot 99%", outline: "#7f0000" },
            { swatch: "#fc8d59", label: "Hot 95%", outline: "#d73027" },
            { swatch: "#dddddd", label: "Not significant" },
            { swatch: "#91bfdb", label: "Cold 95%", outline: "#4575b4" },
            { swatch: "#4575b4", label: "Cold 99%", outline: "#08306b" },
          ]}
        />
      )}
      {showHDBSCAN && (
        <LegendBox
          title="HDBSCAN clusters"
          rows={[
            {
              swatch: "#66bb6a",
              label: "Convex hull (alpha=persistence)",
              outline: "#2e7d32",
            },
          ]}
        />
      )}
    </Box>
  );
};

export default HotspotLegends;
