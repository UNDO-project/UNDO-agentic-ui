// src/theme.ts
import { createTheme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

// Define a basic theme
const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: {
        main: "#1976d2", // Example primary color
      },
      secondary: {
        main: "#dc004e", // Example secondary color
      },
      background: {
        default: mode === "light" ? "#f4f6f8" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
    },
    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none", // Prevent uppercase buttons
          },
        },
      },
      // You can add more component-specific overrides here
    },
  });

export default getAppTheme;
