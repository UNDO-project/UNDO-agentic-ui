// src/components/dashboard/StatsPanel.tsx
import React from "react";
import { Box, Typography, Paper, Button, Grid, Chip } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RouteIcon from "@mui/icons-material/Route";
import ExposureIcon from "@mui/icons-material/Exposure";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import type { TaskResult, OutputFile } from "../../types/api";

interface StatsPanelProps {
  taskResult: TaskResult | null;
  outputFiles: OutputFile[];
  onDownloadFile: (filePath: string, fileName: string) => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  taskResult,
  outputFiles,
  onDownloadFile,
}) => {
  const totalCameras = taskResult?.analyze?.element_count ?? 0;
  const scraped = taskResult?.scrape?.elements_count ?? 0;
  const hasRouting = taskResult?.routing?.success ?? false;
  const exposureScore = taskResult?.routing?.exposure_score;
  const routeLength = taskResult?.routing?.length_m;

  return (
    <Paper className="p-4">
      <Grid container spacing={2}>
        {/* Camera Stats */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box className="p-3 text-center rounded-lg bg-blue-50">
            <CameraAltIcon className="mb-2 text-blue-600" fontSize="large" />
            <Typography variant="h4" className="font-bold text-blue-600">
              {totalCameras}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Cameras Analyzed
            </Typography>
          </Box>
        </Grid>

        {/* Scraped Elements */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box className="p-3 text-center rounded-lg bg-green-50">
            <Typography variant="h4" className="font-bold text-green-600">
              {scraped}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Elements Scraped
            </Typography>
          </Box>
        </Grid>

        {/* Routing Info */}
        {hasRouting && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="p-3 text-center rounded-lg bg-purple-50">
                <RouteIcon className="mb-2 text-purple-600" fontSize="large" />
                <Typography variant="h4" className="font-bold text-purple-600">
                  {routeLength
                    ? `${(routeLength / 1000).toFixed(2)} km`
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Route Length
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="p-3 text-center rounded-lg bg-orange-50">
                <ExposureIcon
                  className="mb-2 text-orange-600"
                  fontSize="large"
                />
                <Typography variant="h4" className="font-bold text-orange-600">
                  {exposureScore ? exposureScore.toFixed(2) : "N/A"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Exposure Score
                </Typography>
              </Box>
            </Grid>
          </>
        )}

        {/* Status Chips */}
        <Grid size={{ xs: 12 }}>
          <Box className="flex flex-wrap gap-2">
            <Chip
              label={`Scraping: ${taskResult?.scrape?.success ? "Success" : "Failed"}`}
              color={taskResult?.scrape?.success ? "success" : "error"}
              size="small"
            />
            <Chip
              label={`Analysis: ${taskResult?.analyze?.success ? "Success" : "Failed"}`}
              color={taskResult?.analyze?.success ? "success" : "error"}
              size="small"
            />
            {hasRouting && (
              <Chip
                label="Routing: Success"
                color="success"
                size="small"
                icon={<RouteIcon />}
              />
            )}
          </Box>
        </Grid>

        {/* Downloads */}
        {outputFiles.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" className="mb-2">
              Additional Downloads:
            </Typography>
            <Box className="flex flex-wrap gap-2">
              {outputFiles.slice(0, 3).map((file) => (
                <Button
                  key={file.path}
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => onDownloadFile(file.path, file.name)}
                >
                  {file.name.replace(`${taskResult?.city}_`, "").split(".")[0]}
                </Button>
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default StatsPanel;
