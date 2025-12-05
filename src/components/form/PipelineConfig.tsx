// src/components/form/PipelineConfig.tsx
import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  type SelectChangeEvent,
} from "@mui/material";
import type { Scenario, PipelineRequest, RoutingConfig } from "../../types/api";
import MapPicker from "../map/MapPicker"; // Uncommented MapPicker import

interface PipelineConfigProps {
  onStartScan: (request: PipelineRequest) => void;
  isLoading: boolean;
}

const PipelineConfig: React.FC<PipelineConfigProps> = ({
  onStartScan,
  isLoading,
}) => {
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [scenario, setScenario] = useState<Scenario>("basic");
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

    onStartScan({
      city,
      country: country || undefined,
      scenario,
      routing_config: routingConfig,
    });
  };

  const handleScenarioChange = (event: SelectChangeEvent) => {
    setScenario(event.target.value as Scenario);
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
        Configure Surveillance Scan
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
        <InputLabel id="scenario-select-label">Scenario</InputLabel>
        <Select
          labelId="scenario-select-label"
          id="scenario-select"
          value={scenario}
          label="Scenario"
          onChange={handleScenarioChange}
          fullWidth
        >
          <MenuItem value="basic">Basic</MenuItem>
          <MenuItem value="full">Full</MenuItem>
          <MenuItem value="quick">Quick</MenuItem>
          <MenuItem value="report">Report</MenuItem>
          <MenuItem value="mapping">Mapping</MenuItem>
        </Select>
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

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={isLoading || !isFormValid}
        className="mt-8"
      >
        {isLoading ? "Starting Scan..." : "Start Surveillance Scan"}
      </Button>
    </Box>
  );
};

export default PipelineConfig;
