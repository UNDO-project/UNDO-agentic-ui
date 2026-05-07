// src/components/form/PipelineConfig.tsx
import React, { useState } from "react";
import {
  TextField,
  FormControl,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Grid,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type {
  Scenario,
  PipelineRequest,
  RoutingConfig,
  OutputOverrides,
} from "../../types/api";
import MapPicker from "../map/MapPicker"; // Uncommented MapPicker import

/**
 * Effective output toggle values for each scenario preset. Mirrors the
 * backend's ``PipelineConfig.from_scenario`` baseline so the UI can show
 * the user what the preset will produce before any override is applied.
 */
const PRESET_DEFAULTS: Record<Scenario, Required<OutputOverrides>> = {
  basic: {
    generate_geojson: true,
    compute_stats: true,
    generate_chart: false,
    generate_heatmap: false,
    generate_hotspots: false,
    plot_zone_sensitivity: false,
    plot_sensitivity_reasons: false,
    plot_hotspots: false,
  },
  full: {
    generate_geojson: true,
    compute_stats: true,
    generate_chart: true,
    generate_heatmap: true,
    generate_hotspots: true,
    plot_zone_sensitivity: true,
    plot_sensitivity_reasons: true,
    plot_hotspots: true,
  },
};

/**
 * Display order + labels for the per-output toggle checkboxes shown in
 * the Advanced section. Keeping this declarative makes the form trivial
 * to extend when new toggles land on the backend.
 */
const TOGGLE_ROWS: Array<{ key: keyof OutputOverrides; label: string }> = [
  { key: "generate_geojson", label: "Enriched GeoJSON" },
  { key: "compute_stats", label: "Summary statistics" },
  { key: "generate_chart", label: "Privacy pie chart" },
  { key: "plot_zone_sensitivity", label: "Zone-sensitivity bar chart" },
  { key: "plot_sensitivity_reasons", label: "Sensitivity-reasons bar chart" },
  { key: "generate_heatmap", label: "Heatmap (HTML)" },
  { key: "generate_hotspots", label: "Hotspots GeoJSON" },
  { key: "plot_hotspots", label: "Hotspots scatter plot (PNG)" },
];

interface PipelineConfigProps {
  onStartScan: (request: PipelineRequest) => void;
  isLoading: boolean;
  onViewLastResults?: () => void;
  lastResultsCity?: string;
}

const PipelineConfig: React.FC<PipelineConfigProps> = ({
  onStartScan,
  isLoading,
  onViewLastResults,
  lastResultsCity,
}) => {
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [scenario, setScenario] = useState<Scenario>("basic");
  const [overrides, setOverrides] = useState<OutputOverrides>({});
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [enableRouting, setEnableRouting] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  // Helper for coordinate validation
  const isValidCoordinate = (
    lat: number | undefined,
    lon: number | undefined,
  ): boolean => {
    if (lat === undefined || lon === undefined) return false;
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    let routingConfig: RoutingConfig | undefined;
    if (
      enableRouting &&
      startPoint &&
      endPoint &&
      city &&
      isValidCoordinate(startPoint.lat, startPoint.lon) &&
      isValidCoordinate(endPoint.lat, endPoint.lon)
    ) {
      routingConfig = {
        city,
        country: country || undefined,
        start_lat: startPoint.lat,
        start_lon: startPoint.lon,
        end_lat: endPoint.lat,
        end_lon: endPoint.lon,
      };
    }

    const request: PipelineRequest = {
      city,
      country: country, // Send country as "" if empty, instead of undefined
      scenario,
      routing_config: routingConfig,
    };
    // Only attach overrides when at least one toggle diverges from the
    // preset baseline. This keeps the request shape unchanged for users
    // who never opened the Advanced section.
    if (Object.keys(overrides).length > 0) {
      request.overrides = overrides;
    }
    onStartScan(request);
  };

  /**
   * Re-clicking the active preset clears the overrides bag (per the
   * Frontend #1 spec). Switching presets keeps the overrides — the user
   * may want their ad-hoc tweaks layered onto the new baseline.
   */
  const handleScenarioChange = (
    _event: React.MouseEvent<HTMLElement>,
    next: Scenario | null,
  ) => {
    if (next === null) {
      // Re-click on the active button: ignore (ToggleButtonGroup default)
      // but also clear overrides so the user gets a clean preset.
      setOverrides({});
      return;
    }
    if (next === scenario) {
      setOverrides({});
      return;
    }
    setScenario(next);
  };

  const effectiveValue = (key: keyof OutputOverrides): boolean => {
    const o = overrides[key];
    return o !== undefined ? o : PRESET_DEFAULTS[scenario][key];
  };

  /**
   * Flip a toggle. If the resulting value matches the preset baseline
   * the override key is removed (cleaner state — `overrides` only
   * carries divergences, never redundant agreements).
   */
  const handleToggleOverride = (key: keyof OutputOverrides) => {
    const nextValue = !effectiveValue(key);
    setOverrides((prev) => {
      const next = { ...prev };
      if (nextValue === PRESET_DEFAULTS[scenario][key]) {
        delete next[key];
      } else {
        next[key] = nextValue;
      }
      return next;
    });
  };

  const handleMapPick = (
    // Uncommented handleMapPick function
    start: { lat: number; lon: number } | null,
    end: { lat: number; lon: number } | null,
  ) => {
    setStartPoint(start);
    setEndPoint(end);
  };

  const isCityValid = city.trim() !== "";
  const isStartPointValid =
    startPoint && isValidCoordinate(startPoint.lat, startPoint.lon);
  const isEndPointValid =
    endPoint && isValidCoordinate(endPoint.lat, endPoint.lon);

  const isRoutingConfigValid = enableRouting
    ? isStartPointValid && isEndPointValid
    : true;

  const isFormValid = isCityValid && isRoutingConfigValid;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      className="max-w-2xl p-6 mx-auto space-y-6 bg-white rounded-lg shadow-lg"
      noValidate
      autoComplete="off"
    >
      <Typography variant="h5" component="h2" className="mb-6 text-center">
        Configure Surveillance Pipeline
      </Typography>

      <FormControl fullWidth required margin="normal">
        <TextField
          label="City Name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          variant="outlined"
          required
          fullWidth
          error={!isCityValid && enableRouting}
          helperText={!isCityValid && enableRouting ? "City is required" : ""}
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <TextField
          label="Country Code (e.g., DE, GR)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth required margin="normal">
        <Typography variant="subtitle2" className="mb-2">
          Scenario
        </Typography>
        <ToggleButtonGroup
          value={scenario}
          exclusive
          onChange={handleScenarioChange}
          aria-label="Analysis scenario preset"
          fullWidth
        >
          <ToggleButton value="basic" aria-label="Basic preset">
            Basic
          </ToggleButton>
          <ToggleButton value="full" aria-label="Full preset">
            Full
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" className="block mt-1 text-gray-500">
          {scenario === "basic"
            ? "Enriched data + summary stats. No charts or maps."
            : "Every output enabled: charts, heatmap, hotspots, and stats."}
        </Typography>

        <Button
          variant="text"
          size="small"
          onClick={() => setAdvancedOpen((v) => !v)}
          endIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          className="mt-2 self-start"
        >
          Advanced
          {Object.keys(overrides).length > 0
            ? ` (${Object.keys(overrides).length} override${
                Object.keys(overrides).length === 1 ? "" : "s"
              })`
            : ""}
        </Button>

        <Collapse in={advancedOpen} unmountOnExit>
          <Box className="p-3 mt-2 border rounded-md">
            <Typography variant="caption" className="block mb-2 text-gray-500">
              Overrides layer on top of the preset. Re-click the active preset
              to clear all overrides.
            </Typography>
            <FormGroup>
              {TOGGLE_ROWS.map(({ key, label }) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={effectiveValue(key)}
                      onChange={() => handleToggleOverride(key)}
                      size="small"
                    />
                  }
                  label={
                    <span>
                      {label}
                      {overrides[key] !== undefined && (
                        <Typography
                          component="span"
                          variant="caption"
                          className="ml-2 text-amber-600"
                        >
                          (overridden)
                        </Typography>
                      )}
                    </span>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </Collapse>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={enableRouting}
            onChange={(e) => setEnableRouting(e.target.checked)}
            name="enableRouting"
            color="primary"
          />
        }
        label="Compute Safe Route"
        className="mt-4"
      />

      {enableRouting && (
        <Box className="p-4 mt-4 space-y-4 border rounded-lg">
          <Typography variant="h6" component="h3">
            Route Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Start Latitude"
                type="number"
                value={startPoint?.lat ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartPoint((prev) => ({
                    lat: isNaN(val) ? 0 : val,
                    lon: prev?.lon ?? 0,
                  }));
                }}
                fullWidth
                required
                error={
                  !startPoint ||
                  !isValidCoordinate(startPoint.lat, startPoint.lon)
                }
                helperText={
                  !startPoint
                    ? "Required"
                    : !isValidCoordinate(startPoint.lat, startPoint.lon)
                      ? "Invalid Latitude (-90 to 90)"
                      : ""
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Start Longitude"
                type="number"
                value={startPoint?.lon ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartPoint((prev) => ({
                    lat: prev?.lat ?? 0,
                    lon: isNaN(val) ? 0 : val,
                  }));
                }}
                fullWidth
                required
                error={
                  !startPoint ||
                  !isValidCoordinate(startPoint.lat, startPoint.lon)
                }
                helperText={
                  !startPoint
                    ? "Required"
                    : !isValidCoordinate(startPoint.lat, startPoint.lon)
                      ? "Invalid Longitude (-180 to 180)"
                      : ""
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="End Latitude"
                type="number"
                value={endPoint?.lat ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndPoint((prev) => ({
                    lat: isNaN(val) ? 0 : val,
                    lon: prev?.lon ?? 0,
                  }));
                }}
                fullWidth
                required
                error={
                  !endPoint || !isValidCoordinate(endPoint.lat, endPoint.lon)
                }
                helperText={
                  !endPoint
                    ? "Required"
                    : !isValidCoordinate(endPoint.lat, endPoint.lon)
                      ? "Invalid Latitude (-90 to 90)"
                      : ""
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="End Longitude"
                type="number"
                value={endPoint?.lon ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndPoint((prev) => ({
                    lat: prev?.lat ?? 0,
                    lon: isNaN(val) ? 0 : val,
                  }));
                }}
                fullWidth
                required
                error={
                  !endPoint || !isValidCoordinate(endPoint.lat, endPoint.lon)
                }
                helperText={
                  !endPoint
                    ? "Required"
                    : !isValidCoordinate(endPoint.lat, endPoint.lon)
                      ? "Invalid Longitude (-180 to 180)"
                      : ""
                }
              />
            </Grid>
          </Grid>

          <Box className="flex items-center justify-center w-full mt-4 overflow-hidden border border-gray-300 rounded-md h-96">
            <MapPicker
              key={
                enableRouting ? "routing-map-active" : "routing-map-inactive"
              } // Key changes when routing is enabled/disabled
              onPointsChange={handleMapPick}
              initialStart={startPoint}
              initialEnd={endPoint}
            />
          </Box>
        </Box>
      )}

      {onViewLastResults && lastResultsCity && (
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          size="large"
          onClick={onViewLastResults}
          className="mt-4"
        >
          View Last Results ({lastResultsCity})
        </Button>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={isLoading || !isFormValid}
        className="mt-4"
      >
        {isLoading ? "Starting Scan..." : "Start Surveillance Scan"}
      </Button>
    </Box>
  );
};

export default PipelineConfig;
