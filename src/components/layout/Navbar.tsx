import { Link as RouterLink, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import RadarIcon from "@mui/icons-material/Radar";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "How It Works", path: "/how-it-works" },
];

function Navbar() {
  const location = useLocation();

  return (
    <AppBar position="static" sx={{ bgcolor: "background.paper" }}>
      <Toolbar className="px-4">
        <RadarIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 0,
            textDecoration: "none",
            color: "text.primary",
            fontWeight: 600,
            mr: 4,
          }}
        >
          Surveillance Research
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              sx={{
                color:
                  location.pathname === item.path
                    ? "primary.main"
                    : "text.secondary",
                fontWeight: location.pathname === item.path ? 600 : 400,
                "&:hover": {
                  color: "primary.main",
                  bgcolor: "rgba(0, 255, 0, 0.08)",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Button
          component={RouterLink}
          to="/scan"
          variant={location.pathname === "/scan" ? "contained" : "outlined"}
          color="primary"
        >
          Start Scan
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
