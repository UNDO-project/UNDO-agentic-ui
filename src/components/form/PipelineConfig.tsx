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
} from "@mui/material";
import { Scenario, PipelineRequest } from "../../types/api";

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onStartScan({ city, country: country || undefined, scenario });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white shadow-lg rounded-lg"
      noValidate
      autoComplete="off"
    >
      <Typography variant="h5" component="h2" className="text-center">
        Configure Surveillance Scan
      </Typography>

      <FormControl fullWidth required>
        <TextField
          label="City Name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          variant="outlined"
          required
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth>
        <TextField
          label="Country Code (e.g., DE, GR)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth required>
        <InputLabel id="scenario-select-label">Scenario</InputLabel>
        <Select
          labelId="scenario-select-label"
          id="scenario-select"
          value={scenario}
          label="Scenario"
          onChange={(e) => setScenario(e.target.value as Scenario)}
          fullWidth
        >
          <MenuItem value="basic">Basic</MenuItem>
          <MenuItem value="full">Full</MenuItem>
          <MenuItem value="quick">Quick</MenuItem>
          <MenuItem value="report">Report</MenuItem>
          <MenuItem value="mapping">Mapping</MenuItem>
        </Select>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={isLoading || !city}
        className="mt-8"
      >
        {isLoading ? "Starting Scan..." : "Start Surveillance Scan"}
      </Button>
    </Box>
  );
};

export default PipelineConfig;
