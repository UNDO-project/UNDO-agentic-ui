// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  Container,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SurveillanceMap from "../map/SurveillanceMap";
import StatsPanel from "./StatsPanel";
import { getCityOutputs, getGeoJson, downloadFile } from "../../api/outputs";
import { getPipelineStatus } from "../../api/pipeline";
import type { TaskResult, OutputFile } from "../../types/api";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { RouteProperties } from "../../types/api";

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
  const [routeGeoJson, setRouteGeoJson] = useState<FeatureCollection<
    Geometry,
    RouteProperties
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEnrichedLayer, setShowEnrichedLayer] = useState(true);
  const [showRouteLayer, setShowRouteLayer] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch task result for stats
      const taskResponse = await getPipelineStatus(taskId);
      if (taskResponse.result) {
        setTaskResult(taskResponse.result);
      }

      // Fetch output files list
      const outputsResponse = await getCityOutputs(city);
      setOutputFiles(outputsResponse.files);

      // Fetch enriched GeoJSON
      const enrichedBlob = await getGeoJson(city, true);
      const enrichedText = await enrichedBlob.text();
      setEnrichedGeoJson(JSON.parse(enrichedText));

      // Fetch route GeoJSON if routing was enabled and successful
      if (taskResponse.result?.routing?.success) {
        // Assuming getGeoJson(city, false) gets the route, or use a specific endpoint
        // For now, let's assume getGeoJson(city, false) is configured to return route GeoJSON.
        // If the backend has a separate endpoint for route, it should be used.
        // For simplicity and based on api/outputs.ts, trying `getGeoJson(city, false)`
        const routeBlob = await getGeoJson(city, false);
        const routeText = await routeBlob.text();
        setRouteGeoJson(JSON.parse(routeText));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [taskId, city]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      } catch (err) {
        console.error("Failed to download file:", err);
        alert("Failed to download file.");
      }
    },
    [],
  );

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8 text-center">
        <CircularProgress className="mb-4" />
        <Typography>Loading dashboard data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
        <Button onClick={onBackToConfig} startIcon={<ArrowBackIcon />}>
          Back to Configuration
        </Button>
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
          Surveillance Dashboard for {city}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsPanel
            city={city}
            taskResult={taskResult}
            outputFiles={outputFiles}
            showEnrichedLayer={showEnrichedLayer}
            showRouteLayer={showRouteLayer}
            onToggleEnrichedLayer={setShowEnrichedLayer}
            onToggleRouteLayer={setShowRouteLayer}
            onDownloadFile={handleDownload}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <SurveillanceMap
            enrichedGeoJson={enrichedGeoJson}
            routeGeoJson={routeGeoJson}
            showEnrichedLayer={showEnrichedLayer}
            showRouteLayer={showRouteLayer}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
