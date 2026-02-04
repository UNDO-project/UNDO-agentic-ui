// src/components/dashboard/StatsPanel.tsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Divider,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { TaskResult, OutputFile } from "../../types/api";

interface StatsPanelProps {
  city: string;
  taskResult: TaskResult | null;
  outputFiles: OutputFile[];
  showEnrichedLayer: boolean;
  showRouteLayer: boolean;
  onToggleEnrichedLayer: (checked: boolean) => void;
  onToggleRouteLayer: (checked: boolean) => void;
  onDownloadFile: (fileName: string) => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  city,
  taskResult,
  outputFiles,
  showEnrichedLayer,
  showRouteLayer,
  onToggleEnrichedLayer,
  onToggleRouteLayer,
  onDownloadFile,
}) => {
  const totalCameras = taskResult?.analyze?.element_count ?? 0;
  const exposureScore = taskResult?.routing?.exposure_score ?? "N/A";
  const routeLength = taskResult?.routing?.length_m
    ? `${(taskResult.routing.length_m / 1000).toFixed(2)} km`
    : "N/A";

  const handleDownloadClick = (fileName: string) => {
    onDownloadFile(fileName);
  };

  return (
    <Paper className="flex flex-col h-full p-4">
      <Typography variant="h6" component="h3" className="mb-4">
        {city} Scan Results
      </Typography>

      <Box className="mb-4">
        <Typography variant="subtitle1" className="font-semibold">
          Statistics
        </Typography>
        <Divider className="my-2" />
        <Box className="space-y-1">
          <Typography variant="body2">
            Total Cameras:{" "}
            <span className="font-medium text-blue-600">{totalCameras}</span>
          </Typography>
          {taskResult?.routing && (
            <>
              <Typography variant="body2">
                Exposure Score:{" "}
                <span className="font-medium text-red-600">
                  {exposureScore !== "N/A"
                    ? exposureScore.toFixed(2)
                    : exposureScore}
                </span>
              </Typography>
              <Typography variant="body2">
                Route Length:{" "}
                <span className="font-medium text-gray-700">{routeLength}</span>
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="subtitle1" className="font-semibold">
          Map Layers
        </Typography>
        <Divider className="my-2" />
        <FormControlLabel
          control={
            <Switch
              checked={showEnrichedLayer}
              onChange={(e) => onToggleEnrichedLayer(e.target.checked)}
              name="showEnrichedLayer"
              color="primary"
            />
          }
          label="Surveillance Cameras"
        />
        <FormControlLabel
          control={
            <Switch
              checked={showRouteLayer}
              onChange={(e) => onToggleRouteLayer(e.target.checked)}
              name="showRouteLayer"
              color="primary"
            />
          }
          label="Safe Route"
        />
        {/* Potentially add "Heatmap" layer toggle here later if heatmap overlay is implemented */}
      </Box>

      <Box className="flex-grow mb-4">
        <Typography variant="subtitle1" className="font-semibold">
          Downloads
        </Typography>
        <Divider className="my-2" />
        <Box className="space-y-2">
          {outputFiles.length === 0 ? (
            <Typography variant="body2" className="italic text-gray-500">
              No files available for download.
            </Typography>
          ) : (
            outputFiles.map((file) => (
              <Button
                key={file.path}
                variant="outlined"
                fullWidth
                startIcon={<FileDownloadIcon />}
                onClick={() => handleDownloadClick(file.name)}
                className="justify-start"
              >
                {file.name}
              </Button>
            ))
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default StatsPanel;
