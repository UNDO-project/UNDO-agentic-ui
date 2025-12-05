import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getAppTheme from "./theme"; // Our custom theme

// For now, let's use a dark theme as per the "hacker" feel mentioned in GEMINI.md
const theme = getAppTheme("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />{" "}
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <App />
    </ThemeProvider>
  </StrictMode>,
);
