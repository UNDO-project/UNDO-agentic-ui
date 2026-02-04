import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const technologies = [
  "React",
  "TypeScript",
  "Vite",
  "Material-UI",
  "Leaflet",
  "OpenStreetMap",
  "Python",
  "FastAPI",
];

function AboutPage() {
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
          The Agentic Surveillance Research System is a tool for analyzing urban
          surveillance infrastructure. It enables researchers and privacy
          advocates to understand the distribution and density of surveillance
          cameras in public spaces.
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          Using data from OpenStreetMap, the system identifies surveillance
          camera locations and computes privacy-preserving walking routes that
          minimize exposure to surveillance. This helps users understand and
          navigate the surveillance landscape of modern cities.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, mb: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          Our mission is to promote transparency and awareness about urban
          surveillance. By making surveillance infrastructure visible and
          analyzable, we empower individuals to make informed decisions about
          their privacy in public spaces.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, bgcolor: "background.paper" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Technology Stack
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          This project is built with modern web technologies and a Python
          backend for data processing and analysis.
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
    </Container>
  );
}

export default AboutPage;
