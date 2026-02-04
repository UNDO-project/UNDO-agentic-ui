// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Container,
  Button,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SurveillanceMap from "../map/SurveillanceMap";
import StatsPanel from "./StatsPanel";
import { getCityOutputs, getGeoJson, downloadFile } from "../../api/outputs";
import { getPipelineStatus } from "../../api/pipeline";
import { useSnackbar } from "../../hooks/useSnackbar";
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

  const { showSnackbar } = useSnackbar();

  const [showEnrichedLayer, setShowEnrichedLayer] = useState(true);
  const [showRouteLayer, setShowRouteLayer] = useState(true);

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

      // Fetch enriched GeoJSON
      const enrichedBlob = await getGeoJson(city, true);
      const enrichedText = await enrichedBlob.text();
      setEnrichedGeoJson(JSON.parse(enrichedText));

      // Fetch route GeoJSON if routing was enabled and successful
      if (taskResponse.result?.routing?.success) {
        const routeBlob = await getGeoJson(city, false);
        const routeText = await routeBlob.text();
        setRouteGeoJson(JSON.parse(routeText));
      }
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

  const handleDownload = useCallback(
    async (fileName: string) => {
      try {
        const fileBlob = await downloadFile(fileName, city);
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
    [showSnackbar, city],
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
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rectangular"
              height={600}
              className="rounded-lg"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton
              variant="rectangular"
              height={600}
              className="rounded-lg"
            />
          </Grid>
        </Grid>
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
