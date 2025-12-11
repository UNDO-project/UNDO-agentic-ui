// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Skeleton,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import MapIcon from "@mui/icons-material/Map";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import SurveillanceMap from "../map/SurveillanceMap";
import StatsPanel from "./StatsPanel";
import { getCityOutputs, getGeoJson, downloadFile } from "../../api/outputs";
import { getPipelineStatus } from "../../api/pipeline";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { TaskResult, OutputFile } from "../../types/api";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

interface DashboardProps {
  taskId: string;
  city: string; // The city for which to display results
  onBackToConfig: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  taskId,
  city,
  onBackToConfig,
}) => {
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [enrichedGeoJson, setEnrichedGeoJson] = useState<FeatureCollection<
    Geometry,
    GeoJsonProperties
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "heatmap" | "hotspots">(
    "map",
  );
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapError, setHeatmapError] = useState(false);
  const [hotspotsUrl, setHotspotsUrl] = useState<string | null>(null);

  const { showSnackbar } = useSnackbar();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch task result for stats
      const taskResponse = await getPipelineStatus(taskId);
      if (taskResponse.result) {
        setTaskResult(taskResponse.result);
      }

      // Fetch output files list
      const outputsResponse = await getCityOutputs(city);
      setOutputFiles(outputsResponse.files);

      // Fetch enriched GeoJSON for camera markers
      const enrichedBlob = await getGeoJson(city, true);
      const enrichedText = await enrichedBlob.text();
      setEnrichedGeoJson(JSON.parse(enrichedText));

      // Set heatmap URL - the /api/v1/outputs/{city}/map endpoint serves the HTML directly
      // The iframe will handle loading it, and we'll catch errors via onError handler
      const heatmapPath = `/api/v1/outputs/${city}/map?map_type=heatmap`;
      setHeatmapUrl(heatmapPath);
      setHeatmapError(false);

      // Set hotspots PNG URL
      const hotspotsPath = `/api/v1/outputs/${city}/map?map_type=hotspots`;
      setHotspotsUrl(hotspotsPath);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      showSnackbar("Failed to load dashboard data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [taskId, city, showSnackbar]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDownloadGeoJson = useCallback(async () => {
    try {
      const geoJsonBlob = await getGeoJson(city, true);
      const url = window.URL.createObjectURL(geoJsonBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${city}_cameras.geojson`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSnackbar(`Downloaded ${city}_cameras.geojson`, "success");
    } catch (err) {
      console.error("Failed to download GeoJSON:", err);
      showSnackbar("Failed to download GeoJSON file.", "error");
    }
  }, [city, showSnackbar]);

  const handleDownload = useCallback(
    async (filePath: string, fileName: string) => {
      try {
        const fileBlob = await downloadFile(filePath);
        const url = window.URL.createObjectURL(new Blob([fileBlob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSnackbar(`Downloaded ${fileName}`, "success");
      } catch (err) {
        console.error("Failed to download file:", err);
        showSnackbar("Failed to download file.", "error");
      }
    },
    [showSnackbar],
  );

  if (loading) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Box className="flex items-center justify-between mb-6">
          <Skeleton
            variant="rectangular"
            width={150}
            height={40}
            className="rounded"
          />
          <Skeleton variant="text" width={400} height={50} />
        </Box>
        <Skeleton variant="rectangular" height={700} className="rounded-lg" />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Box className="flex items-center justify-between mb-6">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBackToConfig}
          variant="outlined"
          color="inherit"
        >
          Back to Config
        </Button>
        <Typography variant="h4" component="h1">
          Surveillance Dashboard - {city}
        </Typography>
        <Box className="flex gap-2">
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadGeoJson}
            variant="contained"
            color="primary"
          >
            Download GeoJSON
          </Button>
        </Box>
      </Box>

      {/* Stats Summary */}
      {taskResult && (
        <Box className="mb-4">
          <StatsPanel
            taskResult={taskResult}
            outputFiles={outputFiles}
            onDownloadFile={handleDownload}
          />
        </Box>
      )}

      {/* View Toggle */}
      <Box className="mb-4 flex justify-center">
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) {
              setViewMode(newMode);
            }
          }}
          aria-label="view mode"
        >
          <ToggleButton value="map" aria-label="map view">
            <MapIcon className="mr-2" />
            Camera Map
          </ToggleButton>
          <ToggleButton value="heatmap" aria-label="heatmap view">
            <LocalFireDepartmentIcon className="mr-2" />
            Heatmap
          </ToggleButton>
          <ToggleButton value="hotspots" aria-label="hotspots view">
            <BubbleChartIcon className="mr-2" />
            Hotspots
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main Visualization */}
      <Paper className="overflow-hidden" sx={{ p: 0 }}>
        {viewMode === "map" ? (
          <SurveillanceMap enrichedGeoJson={enrichedGeoJson} />
        ) : viewMode === "heatmap" ? (
          <Box sx={{ width: "100%", height: "700px", bgcolor: "grey.100" }}>
            {heatmapUrl && !heatmapError ? (
              <iframe
                src={heatmapUrl}
                title="Surveillance Heatmap"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                onError={() => {
                  console.warn("Failed to load heatmap iframe");
                  setHeatmapError(true);
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Heatmap not available
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {heatmapError
                    ? "The heatmap file was not generated for this scan"
                    : "Loading heatmap..."}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "700px",
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            {hotspotsUrl ? (
              <img
                src={hotspotsUrl}
                alt="Surveillance Hotspots"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.warn("Failed to load hotspots image");
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Hotspots not available
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  The hotspots image was not generated for this scan
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;
