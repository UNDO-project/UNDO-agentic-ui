// src/components/form/PipelineConfig.tsx
import React, { useEffect, useState } from "react";
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
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type {
  Scenario,
  PipelineRequest,
  RoutingConfig,
  OutputOverrides,
  CameraFilter,
} from "../../types/api";
import MapPicker from "../map/MapPicker"; // Uncommented MapPicker import
import { getGeoJson } from "../../api/outputs";
import {
  extractOperators,
  extractSurveillanceTypes,
} from "../map/cameraFilter";

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
    // Opt-in; never seeded on by a preset (mirrors the backend baseline).
    district_aggregation: false,
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
    district_aggregation: false,
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
  { key: "district_aggregation", label: "District aggregation (GeoJSON)" },
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
  // District admin level rides the request as a number, not a toggle.
  // Kept as a string so an empty field means "use the backend default".
  const [districtAdminLevel, setDistrictAdminLevel] = useState<string>("");
  const [enableRouting, setEnableRouting] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  // Camera-filter state. All three constraints default to
  // "off" so a user who never touches the filter section sends the
  // pre-Issue-#6 request shape (no ``camera_filter`` key at all).
  const [filterSensitiveOnly, setFilterSensitiveOnly] =
    useState<boolean>(false);
  const [filterOperators, setFilterOperators] = useState<string[]>([]);
  const [filterSurveillanceTypes, setFilterSurveillanceTypes] = useState<
    string[]
  >([]);
  // Auto-discovered option lists, sourced from the most recent enriched
  // GeoJSON for this city. Empty arrays mean "no prior data" — the
  // Autocompletes still accept free-text via ``freeSolo`` so the user
  // can type values for a city they haven't scanned yet.
  const [operatorOptions, setOperatorOptions] = useState<string[]>([]);
  const [surveillanceTypeOptions, setSurveillanceTypeOptions] = useState<
    string[]
  >([]);

  // Pre-populate option lists from the last completed task's enriched
  // GeoJSON, only when the user has typed the same city. State updates
  // happen exclusively inside the async IIFE (post-await) so the
  // ``set-state-in-effect`` lint rule stays happy.
  useEffect(() => {
    if (!enableRouting) return;

    // Resolve the city we'll fetch for (or null when the prior scan
    // doesn't apply). Doing this work outside the IIFE keeps the
    // async block focused on the fetch + setState pair.
    const trimmedCity = city.trim();
    let lastCity: string | null = null;
    if (trimmedCity) {
      const saved = localStorage.getItem("lastCompletedTask");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { city?: string };
          if (
            parsed.city &&
            parsed.city.toLowerCase() === trimmedCity.toLowerCase()
          ) {
            lastCity = parsed.city;
          }
        } catch {
          // Malformed JSON is treated as "no prior task" — fall through
          // to the free-text fallback below.
        }
      }
    }

    let cancelled = false;
    (async () => {
      if (!lastCity) {
        if (!cancelled) {
          setOperatorOptions([]);
          setSurveillanceTypeOptions([]);
        }
        return;
      }
      try {
        const blob = await getGeoJson(lastCity, true);
        const text = await blob.text();
        const fc = JSON.parse(text) as {
          features?: { properties?: Record<string, unknown> }[];
        };
        if (cancelled) return;
        const features = (fc.features ?? []) as Parameters<
          typeof extractOperators
        >[0];
        setOperatorOptions(extractOperators(features));
        setSurveillanceTypeOptions(extractSurveillanceTypes(features));
      } catch {
        // Free-text fallback per spec — no error surfaced. The user
        // just sees the empty Autocomplete and can still type values.
        if (!cancelled) {
          setOperatorOptions([]);
          setSurveillanceTypeOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableRouting, city]);

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

      // Build camera_filter only when the user has actually narrowed the
      // set. All-off ⇒ omit the key entirely so the request shape matches
      // pre-Frontend-#5 / pre-Backend-#6 payloads exactly.
      const hasFilter =
        filterSensitiveOnly ||
        filterOperators.length > 0 ||
        filterSurveillanceTypes.length > 0;
      if (hasFilter) {
        const cameraFilter: CameraFilter = {};
        if (filterSensitiveOnly) cameraFilter.sensitive_only = true;
        if (filterOperators.length > 0)
          cameraFilter.operators = filterOperators;
        if (filterSurveillanceTypes.length > 0)
          cameraFilter.surveillance_types = filterSurveillanceTypes;
        routingConfig.camera_filter = cameraFilter;
      }
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
    // Thread the admin level separately (it's a number, not a toggle) and
    // only when the district layer is actually on and a value was typed.
    // An empty field lets the backend fall back to its DistrictSettings
    // default.
    const districtOn = effectiveValue("district_aggregation");
    const adminLevel = parseInt(districtAdminLevel, 10);
    if (districtOn && Number.isFinite(adminLevel)) {
      request.district_admin_level = adminLevel;
    }
    onStartScan(request);
  };

  /**
   * Re-clicking the active preset clears the overrides bag (per the
   * Frontend spec). Switching presets keeps the overrides — the user
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
          className="self-start mt-2"
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
            {effectiveValue("district_aggregation") && (
              <Box className="mt-3">
                <TextField
                  label="District admin level"
                  type="number"
                  size="small"
                  value={districtAdminLevel}
                  onChange={(e) => setDistrictAdminLevel(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { min: 1, max: 12 } }}
                  helperText="OSM boundary admin_level (e.g. 9 for Malmö boroughs). Leave blank for the backend default."
                />
              </Box>
            )}
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

          <Box className="p-3 mt-2 space-y-3 border rounded-md">
            <Typography variant="subtitle2">
              Camera filter (optional)
            </Typography>
            <Typography variant="caption" className="block text-gray-500">
              Routes will minimise exposure to the selected cameras only. Leave
              every field blank to consider every camera.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={filterSensitiveOnly}
                  onChange={(e) => setFilterSensitiveOnly(e.target.checked)}
                  size="small"
                />
              }
              label="Score only sensitive cameras"
            />

            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={operatorOptions}
              value={filterOperators}
              onChange={(_e, value) => setFilterOperators(value as string[])}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Operators"
                  placeholder={
                    filterOperators.length === 0 ? "All operators" : ""
                  }
                  helperText={
                    operatorOptions.length === 0
                      ? "Type values; no prior scan to suggest from."
                      : `${operatorOptions.length} operator(s) seen in the last scan.`
                  }
                />
              )}
            />

            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={surveillanceTypeOptions}
              value={filterSurveillanceTypes}
              onChange={(_e, value) =>
                setFilterSurveillanceTypes(value as string[])
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Surveillance types"
                  placeholder={
                    filterSurveillanceTypes.length === 0 ? "All types" : ""
                  }
                  helperText={
                    surveillanceTypeOptions.length === 0
                      ? "Type values; no prior scan to suggest from."
                      : `${surveillanceTypeOptions.length} type(s) seen in the last scan.`
                  }
                />
              )}
            />
          </Box>

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
