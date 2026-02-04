import { Link as RouterLink } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import MapIcon from "@mui/icons-material/Map";
import SecurityIcon from "@mui/icons-material/Security";
import RouteIcon from "@mui/icons-material/Route";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const features = [
  {
    icon: <MapIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Urban Mapping",
    description:
      "Analyze surveillance infrastructure in any city using OpenStreetMap data.",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Privacy Analysis",
    description:
      "Identify camera locations and their coverage areas for privacy research.",
  },
  {
    icon: <RouteIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Route Computation",
    description:
      "Compute privacy-preserving walking routes that minimize surveillance exposure.",
  },
  {
    icon: <AnalyticsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Visual Insights",
    description:
      "Interactive maps and statistics to understand surveillance density.",
  },
];

function LandingPage() {
  return (
    <Box className="flex-1 flex flex-col">
      {/* Hero Section */}
      <Box className="flex-1 flex items-center justify-center py-16 px-4">
        <Container maxWidth="md" className="text-center">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Agentic Surveillance Research
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: "text.secondary", mb: 4, maxWidth: 600, mx: "auto" }}
          >
            Analyze urban surveillance infrastructure and compute
            privacy-preserving routes through any city.
          </Typography>
          <Box className="flex gap-4 justify-center">
            <Button
              component={RouterLink}
              to="/scan"
              variant="contained"
              size="large"
              color="primary"
            >
              Start Scanning
            </Button>
            <Button
              component={RouterLink}
              to="/how-it-works"
              variant="outlined"
              size="large"
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ bgcolor: "background.paper", py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 6 }}
          >
            Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    bgcolor: "background.default",
                    textAlign: "center",
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
