// src/theme.ts
import { createTheme } from "@mui/material/styles";

// Terminal/Homebrew-inspired theme
// Always dark mode with green-on-black aesthetic
const getAppTheme = () =>
  createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#00ff00",
        light: "#33ff33",
        dark: "#00cc00",
      },
      secondary: {
        main: "#ffcc00",
        light: "#ffdd44",
        dark: "#cc9900",
      },
      background: {
        default: "#000000",
        paper: "#0d0d0d",
      },
      text: {
        primary: "#00ff00",
        secondary: "#66cc66",
      },
      divider: "rgba(0, 255, 0, 0.2)",
      error: {
        main: "#ff4444",
      },
      warning: {
        main: "#ffcc00",
      },
      success: {
        main: "#00ff00",
      },
    },
    typography: {
      fontFamily:
        '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Menlo, Consolas, monospace',
    },
    shape: {
      borderRadius: 0,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "#000000",
            color: "#00ff00",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
          },
          contained: {
            backgroundColor: "#00ff00",
            color: "#000000",
            "&:hover": {
              backgroundColor: "#33ff33",
            },
          },
          outlined: {
            borderColor: "#00ff00",
            color: "#00ff00",
            "&:hover": {
              borderColor: "#33ff33",
              backgroundColor: "rgba(0, 255, 0, 0.08)",
            },
          },
          text: {
            color: "#00ff00",
            "&:hover": {
              backgroundColor: "rgba(0, 255, 0, 0.08)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid rgba(0, 255, 0, 0.3)",
            boxShadow: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: "none",
            borderBottom: "1px solid rgba(0, 255, 0, 0.3)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          outlined: {
            borderColor: "#00ff00",
            color: "#00ff00",
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: "rgba(0, 255, 0, 0.3)",
            "&.Mui-active": {
              color: "#00ff00",
            },
            "&.Mui-completed": {
              color: "#00ff00",
            },
          },
          text: {
            fill: "#000000",
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            color: "#66cc66",
            "&.Mui-active": {
              color: "#00ff00",
            },
            "&.Mui-completed": {
              color: "#00ff00",
            },
          },
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          line: {
            borderColor: "rgba(0, 255, 0, 0.3)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "rgba(0, 255, 0, 0.3)",
              },
              "&:hover fieldset": {
                borderColor: "#00ff00",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#00ff00",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#66cc66",
            },
            "& .MuiInputBase-input": {
              color: "#00ff00",
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: "#00ff00",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: "rgba(0, 255, 0, 0.08)",
            },
            "&.Mui-selected": {
              backgroundColor: "rgba(0, 255, 0, 0.16)",
              "&:hover": {
                backgroundColor: "rgba(0, 255, 0, 0.24)",
              },
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            "&.Mui-checked": {
              color: "#00ff00",
              "& + .MuiSwitch-track": {
                backgroundColor: "#00ff00",
              },
            },
          },
          track: {
            backgroundColor: "rgba(0, 255, 0, 0.3)",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(0, 255, 0, 0.2)",
          },
          bar: {
            backgroundColor: "#00ff00",
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: "#00ff00",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardSuccess: {
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: "#00ff00",
            border: "1px solid rgba(0, 255, 0, 0.3)",
          },
          standardError: {
            backgroundColor: "rgba(255, 68, 68, 0.1)",
            color: "#ff4444",
            border: "1px solid rgba(255, 68, 68, 0.3)",
          },
          standardWarning: {
            backgroundColor: "rgba(255, 204, 0, 0.1)",
            color: "#ffcc00",
            border: "1px solid rgba(255, 204, 0, 0.3)",
          },
          standardInfo: {
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            color: "#00ff00",
            border: "1px solid rgba(0, 255, 0, 0.3)",
          },
        },
      },
    },
  });

export default getAppTheme;
