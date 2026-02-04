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

const steps = [
  {
    label: "Configure Your Scan",
    description:
      "Enter the city and country you want to analyze. Optionally enable route computation and select start and end points on the map for privacy-preserving path calculation.",
  },
  {
    label: "Data Collection",
    description:
      "The system queries OpenStreetMap to gather surveillance camera locations and relevant geographic data for the specified area.",
  },
  {
    label: "Analysis & Enrichment",
    description:
      "Camera data is processed and enriched with additional context, including coverage estimation and location categorization.",
  },
  {
    label: "Route Computation",
    description:
      "If enabled, the system computes optimal walking routes that minimize exposure to surveillance cameras while maintaining reasonable path lengths.",
  },
  {
    label: "Visualization",
    description:
      "Results are displayed on an interactive map showing camera locations, computed routes, and exposure metrics. Statistics provide quantitative insights into surveillance density.",
  },
];

function HowItWorksPage() {
  return (
    <Container maxWidth="md" className="py-12">
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
        sx={{ color: "text.secondary", mb: 6, maxWidth: 600 }}
      >
        The surveillance research pipeline follows a systematic process to
        analyze urban camera infrastructure and compute privacy-aware routes.
      </Typography>

      <Paper sx={{ p: 4, bgcolor: "background.paper" }}>
        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} active expanded>
              <StepLabel
                StepIconProps={{
                  sx: { color: "primary.main" },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  {step.description}
                </Typography>
                {index === steps.length - 1 && (
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
    </Container>
  );
}

export default HowItWorksPage;
