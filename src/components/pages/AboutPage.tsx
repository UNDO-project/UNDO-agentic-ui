import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const FRONTEND_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.5.0";

const technologies = [
  "React",
  "TypeScript",
  "Vite",
  "Material-UI",
  "Tailwind CSS",
  "Leaflet",
  "Python",
  "FastAPI",
  "LangChain",
  "Ollama",
  "OSMnx",
  "scikit-learn",
  "OpenStreetMap",
];

interface VersionInfo {
  version: string;
  api_version: string;
}

function AboutPage() {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    // /version is mounted at the FastAPI root, not under /api/v1, so this
    // bypasses the shared axios client (which has /api/v1 as its baseURL)
    // and goes straight to the Vite dev proxy.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/version");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: VersionInfo = await res.json();
        if (!cancelled) setBackendVersion(data.version);
      } catch {
        if (!cancelled) setBackendVersion(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Container maxWidth="md" className="py-12">
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, mb: 4 }}
      >
        About This Project
      </Typography>

      <Paper sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Project Overview
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          The Agentic Surveillance Research System is a multi-agent pipeline for
          analyzing the surveillance infrastructure of cities and, when asked,
          computing pedestrian routes that minimize exposure to it. Surveillance
          density is reported as a citable cameras-per-road-km headline figure,
          plus four independent map layers — a KDE density surface, an HDBSCAN
          cluster polygon set, a Getis-Ord Gi* statistical hex grid, and an
          administrative-district choropleth that classifies each camera's
          operator (police / other identified / untagged) — that users can
          toggle on top of the camera map.
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          A <strong>Scraper Agent</strong> pulls camera locations from
          OpenStreetMap via the Overpass API. An <strong>Analyzer Agent</strong>{" "}
          enriches each camera with a local LLM (LangChain on top of Ollama) and
          runs the four-layer hotspot stack alongside statistical charts and an
          LLM-written city report. When start and end coordinates are supplied,
          a <strong>Route Finder Agent</strong> builds an OSMnx pedestrian
          graph, runs k-shortest paths, and scores each candidate by the number
          of cameras within a configurable buffer.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Privacy
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          Once OSM data is on disk, all enrichment, clustering, charting, and
          report generation happens locally — no external LLM provider is
          contacted. Outputs are written under{" "}
          <code>overpass_data/&lt;city&gt;/</code> on the machine that runs the
          backend, and per-artifact caches mean re-running the same scenario
          reuses prior renders instead of regenerating them.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          Make urban surveillance legible. By turning a noisy OSM tag soup into
          maps, charts, and a written summary — and by offering a route that
          walks around the densest clusters — the project gives researchers,
          journalists, and ordinary residents a concrete way to reason about
          what is watching them in public space.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Technology Stack
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          A React + TypeScript frontend talks to a FastAPI backend that
          orchestrates the agent pipeline.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {technologies.map((tech) => (
            <Chip
              key={tech}
              label={tech}
              variant="outlined"
              color="primary"
              size="small"
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Versions
        </Typography>
        <Box sx={{ display: "flex", gap: 3, mt: 1, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Frontend
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontWeight: 600 }}
            >
              {FRONTEND_VERSION}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Backend
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontWeight: 600 }}
            >
              {backendVersion ?? "unavailable"}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default AboutPage;
