// src/components/map/CameraFilterPanel.tsx
import React from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import type { CameraFilter } from "../../types/api";

interface CameraFilterPanelProps {
  operators: string[];
  filter: CameraFilter;
  onChange: (next: CameraFilter) => void;
  visibleCount: number;
  totalCount: number;
}

const CameraFilterPanel: React.FC<CameraFilterPanelProps> = ({
  operators,
  filter,
  onChange,
  visibleCount,
  totalCount,
}) => {
  const updatePrivacy = (
    key: keyof CameraFilter["privacy"],
    checked: boolean,
  ) => {
    onChange({
      ...filter,
      privacy: { ...filter.privacy, [key]: checked },
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ flex: "1 1 240px", minWidth: 240 }}>
          <Autocomplete
            multiple
            size="small"
            options={operators}
            value={filter.operators}
            onChange={(_e, value) => onChange({ ...filter, operators: value })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Operator"
                placeholder={
                  filter.operators.length === 0 ? "All operators" : ""
                }
              />
            )}
            disabled={operators.length === 0}
          />
        </Box>

        <FormControl
          component="fieldset"
          variant="standard"
          sx={{ flex: "0 0 auto" }}
        >
          <FormLabel component="legend" sx={{ fontSize: "0.85rem" }}>
            Privacy
          </FormLabel>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filter.privacy.public}
                  onChange={(e) => updatePrivacy("public", e.target.checked)}
                />
              }
              label="Public"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filter.privacy.private}
                  onChange={(e) => updatePrivacy("private", e.target.checked)}
                />
              }
              label="Private"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filter.privacy.unknown}
                  onChange={(e) => updatePrivacy("unknown", e.target.checked)}
                />
              }
              label="Unknown"
            />
          </FormGroup>
        </FormControl>

        <FormControl
          component="fieldset"
          variant="standard"
          sx={{ flex: "0 0 auto" }}
        >
          <FormLabel component="legend" sx={{ fontSize: "0.85rem" }}>
            Sensitivity
          </FormLabel>
          <RadioGroup
            row
            value={filter.sensitivity}
            onChange={(e) =>
              onChange({
                ...filter,
                sensitivity: e.target.value as CameraFilter["sensitivity"],
              })
            }
          >
            <FormControlLabel
              value="all"
              control={<Radio size="small" />}
              label="All"
            />
            <FormControlLabel
              value="sensitive"
              control={<Radio size="small" />}
              label="Sensitive only"
            />
            <FormControlLabel
              value="non-sensitive"
              control={<Radio size="small" />}
              label="Non-sensitive only"
            />
          </RadioGroup>
        </FormControl>
      </Box>

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, color: "text.secondary" }}
      >
        {visibleCount} of {totalCount} cameras visible
      </Typography>
    </Paper>
  );
};

export default CameraFilterPanel;
