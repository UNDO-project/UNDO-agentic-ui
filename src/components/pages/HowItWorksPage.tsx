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
import MapIcon from "@mui/icons-material/Map";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DescriptionIcon from "@mui/icons-material/Description";

const pipelineSteps = [
  {
    label: "Configure Your Scan",
    agent: null,
    description:
      "Enter the city and country you want to analyze. Choose an analysis scenario based on your needs. Optionally enable route computation and select start/end points on the map.",
  },
  {
    label: "Data Collection",
    agent: "Scraper Agent",
    description:
      "The Scraper Agent queries OpenStreetMap via the Overpass API to download surveillance camera locations and relevant geographic data. Results are cached to avoid redundant requests.",
  },
  {
    label: "Analysis & Enrichment",
    agent: "Analyzer Agent",
    description:
      "The Analyzer Agent processes camera data using a local LLM (no external API calls). It enriches locations with context, estimates coverage areas, categorizes by type, and generates visualizations including heatmaps and hotspot clusters.",
  },
  {
    label: "Route Computation",
    agent: "Route Finder Agent",
    description:
      "If enabled, the Route Finder Agent computes privacy-preserving walking routes using k-shortest paths algorithms. Routes are scored by camera exposure (cameras per kilometer) and compared against the shortest path baseline.",
  },
  {
    label: "Results & Visualization",
    agent: null,
    description:
      "View results on an interactive map with camera markers and computed routes. Download GeoJSON files, heatmaps, and statistical charts. All outputs are stored locally for your privacy.",
  },
];

const scenarios = [
  {
    name: "basic",
    description: "Essential analysis with key output files",
    icon: <SpeedIcon />,
    recommended: true,
  },
  {
    name: "full",
    description: "Complete analysis with all visualizations and reports",
    icon: <AssessmentIcon />,
    recommended: false,
  },
  {
    name: "quick",
    description: "Fast analysis with minimal processing",
    icon: <SpeedIcon />,
    recommended: false,
  },
  {
    name: "report",
    description: "Focus on statistical summaries and charts",
    icon: <DescriptionIcon />,
    recommended: false,
  },
  {
    name: "mapping",
    description: "Emphasis on geospatial visualizations",
    icon: <MapIcon />,
    recommended: false,
  },
];

const routingFeatures = [
  "K-shortest paths algorithm evaluates multiple candidate routes",
  "Exposure scoring counts cameras within 50m buffer radius",
  "Baseline comparison shows privacy gain vs. shortest path",
  "Interactive maps display route with camera coverage circles",
  "Graph caching enables fast re-computation for same city",
];

const outputFiles = [
  {
    name: "Enriched GeoJSON",
    description: "Camera locations with LLM-analyzed metadata",
  },
  {
    name: "Heatmap",
    description: "Interactive HTML showing surveillance density",
  },
  {
    name: "Hotspots",
    description: "DBSCAN clustering of high-density camera areas",
  },
  {
    name: "Route GeoJSON",
    description: "Route geometry with exposure metrics",
  },
  {
    name: "Route Map",
    description: "Interactive map with route and camera coverage",
  },
  {
    name: "Statistics",
    description: "Charts and metrics for surveillance analysis",
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
        {/* Pipeline Steps */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 4, bgcolor: "background.paper", height: "100%" }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Pipeline Steps
            </Typography>
            <Stepper orientation="vertical">
              {pipelineSteps.map((step, index) => (
                <Step key={step.label} active expanded>
                  <StepLabel>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {step.label}
                      </Typography>
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

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Analysis Scenarios */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Analysis Scenarios
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

            {/* Output Files */}
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Generated Outputs
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                {outputFiles.map((file) => (
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
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default HowItWorksPage;
