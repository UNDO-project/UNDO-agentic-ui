// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Container,
  Button,
  Skeleton,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MapIcon from "@mui/icons-material/Map";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import RouteIcon from "@mui/icons-material/Route";
import SurveillanceMap from "../map/SurveillanceMap";
import StatsPanel from "./StatsPanel";
import {
  getCityOutputs,
  getGeoJson,
  downloadFile,
  getChart,
  getHeatmapUrl,
  getHotspotsPlot,
} from "../../api/outputs";
import { getPipelineStatus } from "../../api/pipeline";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { TaskResult, OutputFile } from "../../types/api";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

interface DashboardProps {
  taskId: string;
  city: string;
  onBackToConfig: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
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
  const [activeTab, setActiveTab] = useState(0);

  // Chart image URLs
  const [privacyChartUrl, setPrivacyChartUrl] = useState<string | null>(null);
  const [sensitivityChartUrl, setSensitivityChartUrl] = useState<string | null>(
    null,
  );
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Hotspots image
  const [hotspotsUrl, setHotspotsUrl] = useState<string | null>(null);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);

  // Route URL
  const [routeUrl, setRouteUrl] = useState<string | null>(null);

  const { showSnackbar } = useSnackbar();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch task result for stats
      const taskResponse = await getPipelineStatus(taskId);
      if (taskResponse.result) {
        setTaskResult(taskResponse.result);

        // Set route URL if routing was successful
        if (taskResponse.result?.routing?.route_id) {
          const routePath = `/api/v1/outputs/${city}/route/${taskResponse.result.routing.route_id}?filetype=map`;
          setRouteUrl(routePath);
        }
      }

      // Fetch output files list
      const outputsResponse = await getCityOutputs(city);
      setOutputFiles(outputsResponse.files);

      // Fetch enriched GeoJSON for camera markers
      const enrichedBlob = await getGeoJson(city, true);
      const enrichedText = await enrichedBlob.text();
      setEnrichedGeoJson(JSON.parse(enrichedText));
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      showSnackbar("Failed to load dashboard data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [taskId, city, showSnackbar]);

  // Fetch hotspots plot when Hotspots tab is selected
  const fetchHotspots = useCallback(async () => {
    if (hotspotsUrl) return; // Already loaded

    setHotspotsLoading(true);
    setHotspotsError(null);

    try {
      const blob = await getHotspotsPlot(city);
      const url = URL.createObjectURL(blob);
      setHotspotsUrl(url);
    } catch (err) {
      console.error("Failed to fetch hotspots plot:", err);
      setHotspotsError("Hotspots plot not available for this analysis.");
    } finally {
      setHotspotsLoading(false);
    }
  }, [city, hotspotsUrl]);

  // Fetch charts when Statistics tab is selected
  const fetchCharts = useCallback(async () => {
    if (privacyChartUrl && sensitivityChartUrl) return; // Already loaded

    setChartsLoading(true);
    setChartsError(null);

    try {
      const [privacyBlob, sensitivityBlob] = await Promise.allSettled([
        getChart(city, "privacy"),
        getChart(city, "sensitivity"),
      ]);

      if (privacyBlob.status === "fulfilled") {
        const url = URL.createObjectURL(privacyBlob.value);
        setPrivacyChartUrl(url);
      }

      if (sensitivityBlob.status === "fulfilled") {
        const url = URL.createObjectURL(sensitivityBlob.value);
        setSensitivityChartUrl(url);
      }

      if (
        privacyBlob.status === "rejected" &&
        sensitivityBlob.status === "rejected"
      ) {
        setChartsError("Charts not available for this analysis.");
      }
    } catch (err) {
      console.error("Failed to fetch charts:", err);
      setChartsError("Failed to load charts.");
    } finally {
      setChartsLoading(false);
    }
  }, [city, privacyChartUrl, sensitivityChartUrl]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load hotspots when tab 2 (Hotspots) is selected
  useEffect(() => {
    if (activeTab === 2) {
      fetchHotspots();
    }
  }, [activeTab, fetchHotspots]);

  // Load charts when tab 3 (Statistics) is selected
  useEffect(() => {
    if (activeTab === 3) {
      fetchCharts();
    }
  }, [activeTab, fetchCharts]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (hotspotsUrl) URL.revokeObjectURL(hotspotsUrl);
      if (privacyChartUrl) URL.revokeObjectURL(privacyChartUrl);
      if (sensitivityChartUrl) URL.revokeObjectURL(sensitivityChartUrl);
    };
  }, [hotspotsUrl, privacyChartUrl, sensitivityChartUrl]);

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
    [city, showSnackbar],
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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

  // Determine which tabs to show
  const hasRoute = !!routeUrl;

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
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatsPanel
            city={city}
            taskResult={taskResult}
            outputFiles={outputFiles}
            onDownloadFile={handleDownload}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ bgcolor: "background.paper" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="dashboard visualization tabs"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  minHeight: 56,
                },
              }}
            >
              <Tab
                icon={<MapIcon />}
                label="Camera Map"
                id="dashboard-tab-0"
                aria-controls="dashboard-tabpanel-0"
              />
              <Tab
                icon={<WhatshotIcon />}
                label="Heatmap"
                id="dashboard-tab-1"
                aria-controls="dashboard-tabpanel-1"
              />
              <Tab
                icon={<BubbleChartIcon />}
                label="Hotspots"
                id="dashboard-tab-2"
                aria-controls="dashboard-tabpanel-2"
              />
              <Tab
                icon={<BarChartIcon />}
                label="Statistics"
                id="dashboard-tab-3"
                aria-controls="dashboard-tabpanel-3"
              />
              {hasRoute && (
                <Tab
                  icon={<RouteIcon />}
                  label="Route"
                  id="dashboard-tab-4"
                  aria-controls="dashboard-tabpanel-4"
                />
              )}
            </Tabs>

            {/* Camera Map Tab */}
            <TabPanel value={activeTab} index={0}>
              <SurveillanceMap enrichedGeoJson={enrichedGeoJson} />
            </TabPanel>

            {/* Heatmap Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box
                sx={{
                  height: 600,
                  width: "100%",
                  bgcolor: "background.default",
                }}
              >
                <iframe
                  src={getHeatmapUrl(city)}
                  title="Surveillance Heatmap"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </Box>
            </TabPanel>

            {/* Hotspots Tab */}
            <TabPanel value={activeTab} index={2}>
              <Box
                sx={{
                  minHeight: 400,
                  width: "100%",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hotspotsLoading && (
                  <Skeleton variant="rectangular" height={400} width="100%" />
                )}

                {hotspotsError && !hotspotsLoading && (
                  <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                    <Typography variant="body1">{hotspotsError}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Try running a &quot;full&quot; or &quot;mapping&quot;
                      scenario to generate the hotspots plot.
                    </Typography>
                  </Box>
                )}

                {hotspotsUrl && !hotspotsLoading && (
                  <Box sx={{ textAlign: "center", width: "100%" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Camera Hotspots (DBSCAN Clustering)
                    </Typography>
                    <img
                      src={hotspotsUrl}
                      alt="Surveillance Hotspots Plot"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel value={activeTab} index={3}>
              <Box sx={{ p: 2 }}>
                {chartsLoading && (
                  <Box className="flex flex-col gap-4">
                    <Skeleton variant="rectangular" height={300} />
                    <Skeleton variant="rectangular" height={300} />
                  </Box>
                )}

                {chartsError && !chartsLoading && (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body1">{chartsError}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Try running a &quot;full&quot; or &quot;report&quot;
                      scenario to generate charts.
                    </Typography>
                  </Box>
                )}

                {!chartsLoading && !chartsError && (
                  <Grid container spacing={3}>
                    {privacyChartUrl && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Privacy Analysis
                          </Typography>
                          <img
                            src={privacyChartUrl}
                            alt="Privacy Analysis Chart"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {sensitivityChartUrl && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Sensitivity Analysis
                          </Typography>
                          <img
                            src={sensitivityChartUrl}
                            alt="Sensitivity Analysis Chart"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {!privacyChartUrl && !sensitivityChartUrl && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            p: 4,
                            textAlign: "center",
                            color: "text.secondary",
                          }}
                        >
                          <Typography variant="body1">
                            No charts available.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Try running a &quot;full&quot; or &quot;report&quot;
                            scenario to generate statistical charts.
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            </TabPanel>

            {/* Route Tab (conditional) */}
            {hasRoute && (
              <TabPanel value={activeTab} index={4}>
                <Box
                  sx={{
                    height: 600,
                    width: "100%",
                    bgcolor: "background.default",
                  }}
                >
                  <iframe
                    src={routeUrl!}
                    title="Privacy-Preserving Route"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                </Box>
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
