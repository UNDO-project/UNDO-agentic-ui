import { Link as RouterLink } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import StorageIcon from "@mui/icons-material/Storage";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RouteIcon from "@mui/icons-material/Route";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CachedIcon from "@mui/icons-material/Cached";
import LayersIcon from "@mui/icons-material/Layers";

const pipelineSteps = [
  {
    label: "Configure Your Scan",
    agent: null,
    optional: false,
    description:
      "Enter the city and country you want to analyze. Choose an analysis scenario based on your needs. Optionally enable route computation and select start/end points on the map.",
  },
  {
    label: "Data Collection",
    agent: "Scraper Agent",
    optional: false,
    description:
      "The Scraper Agent queries OpenStreetMap via the Overpass API to download surveillance camera locations and relevant geographic data. Results are cached to avoid redundant requests.",
  },
  {
    label: "Analysis & Enrichment",
    agent: "Analyzer Agent",
    optional: false,
    description:
      "The Analyzer Agent processes camera data using a local LLM (no external API calls). It enriches each camera with context and runs a four-layer hotspot stack: a planar KDE density surface for the smooth heatmap, an HDBSCAN polygon clustering of dense pockets, a Getis-Ord Gi* hex grid for statistical hot/cold classification, and a cameras-per-road-km headline metric for cross-city comparison. Statistical charts and an LLM-written city report follow when the scenario asks for them.",
  },
  {
    label: "Route Computation",
    agent: "Route Finder Agent",
    optional: true,
    description:
      "Runs only when start and end coordinates are supplied in the scan form. The Route Finder Agent builds (or reuses) an OSMnx pedestrian graph, generates k candidate paths, and scores each by the number of cameras within the configured buffer radius. The result is compared against the shortest-path baseline so the privacy gain is explicit.",
  },
  {
    label: "Results & Visualization",
    agent: null,
    optional: false,
    description:
      "View results on an interactive map with camera markers and computed routes. Browse statistical charts and the city report. Download GeoJSON, heatmap HTML, and chart PNGs. All outputs are stored locally for your privacy.",
  },
];

const scenarios = [
  {
    name: "basic",
    description:
      "Enriched GeoJSON + statistics. No charts, heatmap, hotspots, or report — the fastest end-to-end run.",
    icon: <SpeedIcon />,
    recommended: true,
  },
  {
    name: "full",
    description:
      "Every output toggle on: heatmap, hotspots, all six stat charts, and the LLM-written city report.",
    icon: <AssessmentIcon />,
    recommended: false,
  },
];

const routingFeatures = [
  "K-shortest paths algorithm evaluates multiple candidate routes",
  "Exposure scoring counts cameras within the configured buffer radius",
  "Baseline comparison shows privacy gain vs. shortest path",
  "Interactive maps display route with camera coverage circles",
  "Graph caching enables fast re-computation for same city",
];

const outputGroups: {
  title: string;
  files: { name: string; description: string }[];
}[] = [
  {
    title: "Geospatial",
    files: [
      {
        name: "Enriched GeoJSON",
        description: "Camera locations with LLM-analyzed metadata",
      },
      {
        name: "Heatmap",
        description: "Interactive HTML showing surveillance density",
      },
      {
        name: "KDE density contours",
        description:
          "Planar kernel-density polygons at the 50/75/90/95 percentiles",
      },
      {
        name: "Gi* hex grid",
        description: "Getis-Ord Gi* hot/cold hexes with FDR-adjusted p-values",
      },
      {
        name: "HDBSCAN polygons",
        description: "Density-based cluster hulls with persistence scores",
      },
      {
        name: "Density metrics",
        description: "Headline cameras-per-road-km + cameras-per-km² (JSON)",
      },
      {
        name: "Route GeoJSON",
        description: "Route geometry with exposure metrics (when routing runs)",
      },
      {
        name: "Route Map",
        description: "Interactive map with route and camera coverage",
      },
    ],
  },
  {
    title: "Statistics",
    files: [
      {
        name: "Privacy distribution",
        description: "Public vs. private camera split",
      },
      {
        name: "Sensitivity reasons",
        description: "Why each camera was flagged sensitive",
      },
      {
        name: "Operator distribution",
        description: "Top operators in the area",
      },
      {
        name: "Manufacturer distribution",
        description: "Top manufacturer tags in OSM",
      },
      {
        name: "Install timeline",
        description: "Cameras grouped by install year",
      },
      {
        name: "Zone sensitivity",
        description: "Sensitivity scoring per zone",
      },
    ],
  },
  {
    title: "Narrative",
    files: [
      {
        name: "City Report",
        description: "LLM-written Markdown summary of the analysis",
      },
    ],
  },
];

function HowItWorksPage() {
  return (
    <Container maxWidth="lg" className="py-12">
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700, mb: 2 }}
      >
        How It Works
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: "text.secondary", mb: 2, maxWidth: 700 }}
      >
        A multi-agent system for analyzing surveillance infrastructure and
        computing privacy-preserving walking routes using OpenStreetMap data.
      </Typography>
      <Box sx={{ mb: 6, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          icon={<SecurityIcon />}
          label="Privacy-Focused"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<PsychologyIcon />}
          label="Local LLM Processing"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<StorageIcon />}
          label="Intelligent Caching"
          variant="outlined"
          size="small"
        />
      </Box>

      <Grid container spacing={4}>
        {/* Pipeline Steps — full width so the vertical stepper has room
            without pushing the right column into a thin strip */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Pipeline Steps
            </Typography>
            <Stepper orientation="vertical">
              {pipelineSteps.map((step, index) => (
                <Step key={step.label} active expanded>
                  <StepLabel>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {step.label}
                        </Typography>
                        {step.optional && (
                          <Chip
                            label="optional"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                      {step.agent && (
                        <Chip
                          label={step.agent}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {step.description}
                    </Typography>
                    {index === pipelineSteps.length - 1 && (
                      <Box sx={{ mt: 3 }}>
                        <Button
                          component={RouterLink}
                          to="/scan"
                          variant="contained"
                          color="primary"
                        >
                          Start Your First Scan
                        </Button>
                      </Box>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Supporting cards — two columns on lg, single column on smaller
            viewports. Pairing: Scenarios + Routing on the left, Caching +
            Outputs on the right (Outputs is the tallest, paired with the
            smallest). */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Analysis Scenarios */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Analysis Scenarios
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                Two presets cover the common cases. The scan form lets you
                override individual outputs (heatmap, hotspots, individual
                charts, report) on top of either preset.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {scenarios.map((scenario) => (
                  <Box
                    key={scenario.name}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ color: "primary.main", mt: 0.25 }}>
                      {scenario.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontFamily: "monospace" }}
                        >
                          {scenario.name}
                        </Typography>
                        {scenario.recommended && (
                          <Chip
                            label="default"
                            size="small"
                            sx={{ height: 18, fontSize: "0.65rem" }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {scenario.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Routing Features */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <RouteIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Privacy-Preserving Routing
                </Typography>
              </Box>
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                }}
              >
                {routingFeatures.map((feature) => (
                  <Box component="li" key={feature}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Caching */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CachedIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Caching
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                Re-running the same scenario reuses prior work instead of
                regenerating it: scrape results are keyed by city, enrichment is
                keyed by camera set, and each rendered artifact carries a{" "}
                <code>.cache.json</code> sidecar that lets the pipeline skip
                expensive renders when inputs are unchanged.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Distributions that have nothing to render (e.g. a city whose OSM
                data has no manufacturer tags) are skipped rather than emitted
                as empty placeholders.
              </Typography>
            </Paper>

            {/* Hotspot methodology. Four complementary layers,
                each answering a different question. Sits next to Caching
                because it's the other "what the pipeline actually does"
                explainer — Outputs below lists the artifact files. */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <LayersIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Hotspot methodology
                </Typography>
              </Box>
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                }}
              >
                <Box component="li">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>KDE density</strong> — a smooth surface of camera
                    density evaluated on a metric grid; the heatmap is derived
                    from it rather than from raw points.
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>HDBSCAN polygons</strong> — density-based cluster
                    hulls that adapt their bandwidth locally, so dense downtown
                    blocks don't fuse with sparse suburbs.
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>Gi* hex grid</strong> — Getis-Ord Gi* with
                    FDR-adjusted p-values, classifying each hex as statistically
                    hot, cold, or not significant.
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>Cameras per road-km</strong> — a single citable
                    headline figure that normalises by the pedestrian network
                    humans actually use.
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.secondary", mt: 1.5 }}
              >
                Method references: Amnesty International,{" "}
                <em>Decode Surveillance NYC</em>; Stanford RegLab,{" "}
                <em>Surveilling Surveillance</em> (2021).
              </Typography>
            </Paper>

            {/* Output Files */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Generated Outputs
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {outputGroups.map((group) => (
                  <Box key={group.title}>
                    <Typography
                      variant="overline"
                      sx={{ color: "text.secondary" }}
                    >
                      {group.title}
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      {group.files.map((file) => (
                        <Grid size={{ xs: 6 }} key={file.name}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {file.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {file.description}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default HowItWorksPage;
