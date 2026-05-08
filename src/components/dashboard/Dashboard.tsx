// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SurveillanceMap from "../map/SurveillanceMap";
import CameraFilterPanel from "../map/CameraFilterPanel";
import {
  DEFAULT_CAMERA_FILTER,
  extractOperators,
  matchesMapCameraFilter,
} from "../map/cameraFilter";
import StatsPanel from "./StatsPanel";
import {
  getCityOutputs,
  getGeoJson,
  downloadFile,
  getChart,
  getHeatmapUrl,
  getHotspotsPlot,
  getCityReport,
} from "../../api/outputs";
import { getPipelineStatus } from "../../api/pipeline";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { MapCameraFilter, TaskResult, OutputFile } from "../../types/api";
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

  // Camera-map filter. Pure client-side; resets on
  // city change so a fresh dashboard never inherits the prior city's
  // operator selection.
  const [cameraFilter, setCameraFilter] = useState<MapCameraFilter>(
    DEFAULT_CAMERA_FILTER,
  );

  // Chart image URLs
  const [privacyChartUrl, setPrivacyChartUrl] = useState<string | null>(null);
  const [sensitivityChartUrl, setSensitivityChartUrl] = useState<string | null>(
    null,
  );
  const [operatorChartUrl, setOperatorChartUrl] = useState<string | null>(null);
  const [manufacturerChartUrl, setManufacturerChartUrl] = useState<
    string | null
  >(null);
  const [timelineChartUrl, setTimelineChartUrl] = useState<string | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Hotspots image
  const [hotspotsUrl, setHotspotsUrl] = useState<string | null>(null);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);

  // Route URL
  const [routeUrl, setRouteUrl] = useState<string | null>(null);

  // Report markdown (lazy-loaded on Report tab activation)
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const { showSnackbar } = useSnackbar();

  // Operator multi-select options come from the loaded GeoJSON, so
  // they always reflect what's actually plotted. Memoised because
  // ``enrichedGeoJson`` is stable per fetch.
  const availableOperators = useMemo(
    () => (enrichedGeoJson ? extractOperators(enrichedGeoJson.features) : []),
    [enrichedGeoJson],
  );

  // The same predicate the map applies — we just count here so the
  // panel caption stays in sync with what's drawn.
  const visibleCameraCount = useMemo(() => {
    if (!enrichedGeoJson) return 0;
    return enrichedGeoJson.features.reduce(
      (acc, f) => acc + (matchesMapCameraFilter(f, cameraFilter) ? 1 : 0),
      0,
    );
  }, [enrichedGeoJson, cameraFilter]);

  const totalCameraCount = enrichedGeoJson?.features.length ?? 0;

  // Reset filter when the user navigates to a different city's
  // dashboard so the operator selection from city A doesn't silently
  // hide everything in city B.
  useEffect(() => {
    setCameraFilter(DEFAULT_CAMERA_FILTER);
  }, [city]);

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

  // Fetch the LLM-generated city report when the Report tab is selected.
  // Lazy because the dashboard mounts on every revisit; we only pay the
  // markdown round-trip when the user actually opens the tab.
  const fetchReport = useCallback(async () => {
    if (reportMarkdown) return; // Already loaded

    setReportLoading(true);
    setReportError(null);

    try {
      const md = await getCityReport(city);
      setReportMarkdown(md);
    } catch (err) {
      console.error("Failed to fetch city report:", err);
      setReportError("Report not available for this analysis.");
    } finally {
      setReportLoading(false);
    }
  }, [city, reportMarkdown]);

  // Fetch charts when Statistics tab is selected. Privacy and sensitivity
  // come from the dedicated ``/charts`` endpoint; the three Backend
  // charts (operator, manufacturer, install timeline) are looked up
  // through ``outputFiles`` and fetched via ``/file/{filename}`` since
  // their filenames carry the city stem and the dedicated endpoint
  // wasn't extended to know about them.
  const fetchCharts = useCallback(async () => {
    if (
      privacyChartUrl &&
      sensitivityChartUrl &&
      operatorChartUrl &&
      manufacturerChartUrl &&
      timelineChartUrl
    )
      return; // Already loaded

    setChartsLoading(true);
    setChartsError(null);

    // Filename discovery from the file list keeps the lookup tolerant of
    // backend case conventions (the analyzer lowercases the city stem).
    const findFile = (substr: string): string | undefined =>
      outputFiles.find((f) => f.name.toLowerCase().includes(substr))?.name;

    const operatorFile = findFile("operator_distribution");
    const manufacturerFile = findFile("manufacturer_distribution");
    const timelineFile = findFile("install_timeline");

    try {
      const [
        privacyResult,
        sensitivityResult,
        operatorResult,
        manufacturerResult,
        timelineResult,
      ] = await Promise.allSettled([
        getChart(city, "privacy"),
        getChart(city, "sensitivity"),
        operatorFile
          ? downloadFile(operatorFile, city)
          : Promise.reject(new Error("operator chart not generated")),
        manufacturerFile
          ? downloadFile(manufacturerFile, city)
          : Promise.reject(new Error("manufacturer chart not generated")),
        timelineFile
          ? downloadFile(timelineFile, city)
          : Promise.reject(new Error("timeline chart not generated")),
      ]);

      if (privacyResult.status === "fulfilled") {
        setPrivacyChartUrl(URL.createObjectURL(privacyResult.value));
      }
      if (sensitivityResult.status === "fulfilled") {
        setSensitivityChartUrl(URL.createObjectURL(sensitivityResult.value));
      }
      if (operatorResult.status === "fulfilled") {
        setOperatorChartUrl(URL.createObjectURL(operatorResult.value));
      }
      if (manufacturerResult.status === "fulfilled") {
        setManufacturerChartUrl(URL.createObjectURL(manufacturerResult.value));
      }
      if (timelineResult.status === "fulfilled") {
        setTimelineChartUrl(URL.createObjectURL(timelineResult.value));
      }

      const allRejected = [
        privacyResult,
        sensitivityResult,
        operatorResult,
        manufacturerResult,
        timelineResult,
      ].every((r) => r.status === "rejected");
      if (allRejected) {
        setChartsError("Charts not available for this analysis.");
      }
    } catch (err) {
      console.error("Failed to fetch charts:", err);
      setChartsError("Failed to load charts.");
    } finally {
      setChartsLoading(false);
    }
  }, [
    city,
    outputFiles,
    privacyChartUrl,
    sensitivityChartUrl,
    operatorChartUrl,
    manufacturerChartUrl,
    timelineChartUrl,
  ]);

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

  // Report visibility is derived from the city's outputs list — the
  // analyzer writes ``<city>_report.md`` only when ``generate_report``
  // was on, so a present file is the canonical signal. Case-insensitive
  // match because backends lowercase city names when building paths.
  const hasReport = outputFiles.some((f) =>
    f.name.toLowerCase().endsWith("_report.md"),
  );

  // Load the report when tab 4 (Report) is selected. Gated on
  // ``hasReport`` so we don't fire a useless 404 when the tab isn't
  // even visible.
  useEffect(() => {
    if (activeTab === 4 && hasReport) {
      fetchReport();
    }
  }, [activeTab, fetchReport, hasReport]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (hotspotsUrl) URL.revokeObjectURL(hotspotsUrl);
      if (privacyChartUrl) URL.revokeObjectURL(privacyChartUrl);
      if (sensitivityChartUrl) URL.revokeObjectURL(sensitivityChartUrl);
      if (operatorChartUrl) URL.revokeObjectURL(operatorChartUrl);
      if (manufacturerChartUrl) URL.revokeObjectURL(manufacturerChartUrl);
      if (timelineChartUrl) URL.revokeObjectURL(timelineChartUrl);
    };
  }, [
    hotspotsUrl,
    privacyChartUrl,
    sensitivityChartUrl,
    operatorChartUrl,
    manufacturerChartUrl,
    timelineChartUrl,
  ]);

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

  // Determine which tabs to show. ``hasReport`` is derived above so the
  // tab-load effect and the JSX share a single source of truth.
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
                value={0}
                icon={<MapIcon />}
                label="Camera Map"
                id="dashboard-tab-0"
                aria-controls="dashboard-tabpanel-0"
              />
              <Tab
                value={1}
                icon={<WhatshotIcon />}
                label="Heatmap"
                id="dashboard-tab-1"
                aria-controls="dashboard-tabpanel-1"
              />
              <Tab
                value={2}
                icon={<BubbleChartIcon />}
                label="Hotspots"
                id="dashboard-tab-2"
                aria-controls="dashboard-tabpanel-2"
              />
              <Tab
                value={3}
                icon={<BarChartIcon />}
                label="Statistics"
                id="dashboard-tab-3"
                aria-controls="dashboard-tabpanel-3"
              />
              {hasReport && (
                <Tab
                  value={4}
                  icon={<DescriptionIcon />}
                  label="Report"
                  id="dashboard-tab-4"
                  aria-controls="dashboard-tabpanel-4"
                />
              )}
              {hasRoute && (
                <Tab
                  value={5}
                  icon={<RouteIcon />}
                  label="Route"
                  id="dashboard-tab-5"
                  aria-controls="dashboard-tabpanel-5"
                />
              )}
            </Tabs>

            {/* Camera Map Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ px: 2 }}>
                <CameraFilterPanel
                  operators={availableOperators}
                  filter={cameraFilter}
                  onChange={setCameraFilter}
                  visibleCount={visibleCameraCount}
                  totalCount={totalCameraCount}
                />
              </Box>
              <SurveillanceMap
                enrichedGeoJson={enrichedGeoJson}
                filter={cameraFilter}
              />
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
                    {operatorChartUrl && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Operator Distribution
                          </Typography>
                          <img
                            src={operatorChartUrl}
                            alt="Operator Distribution Chart"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {manufacturerChartUrl && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Manufacturer Distribution
                          </Typography>
                          <img
                            src={manufacturerChartUrl}
                            alt="Manufacturer Distribution Chart"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {timelineChartUrl && (
                      <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            Install Timeline
                          </Typography>
                          <img
                            src={timelineChartUrl}
                            alt="Install Timeline Chart"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {!privacyChartUrl &&
                      !sensitivityChartUrl &&
                      !operatorChartUrl &&
                      !manufacturerChartUrl &&
                      !timelineChartUrl && (
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
                              Re-run with the &quot;full&quot; preset (or
                              &quot;basic&quot; with the chart toggles enabled)
                              to generate statistical charts.
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                  </Grid>
                )}
              </Box>
            </TabPanel>

            {/* Report Tab (conditional) */}
            {hasReport && (
              <TabPanel value={activeTab} index={4}>
                <Box sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Surveillance Report — {city}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(`${city}_report.md`)}
                      disabled={!reportMarkdown}
                    >
                      Download
                    </Button>
                  </Box>

                  {reportLoading && (
                    <Box className="flex flex-col gap-2">
                      <Skeleton variant="text" height={32} width="40%" />
                      <Skeleton variant="rectangular" height={120} />
                      <Skeleton variant="rectangular" height={120} />
                    </Box>
                  )}

                  {reportError && !reportLoading && (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body1">{reportError}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Re-run with the &quot;full&quot; preset (or
                        &quot;basic&quot; with --report) to generate one.
                      </Typography>
                    </Box>
                  )}

                  {reportMarkdown && !reportLoading && !reportError && (
                    <Box
                      sx={{
                        // Sensible markdown typography. Mirrors MUI Typography
                        // scale so the report visually fits the rest of the
                        // dashboard without leaning on global CSS.
                        "& h1, & h2, & h3": {
                          fontWeight: 600,
                          mt: 2,
                          mb: 1,
                        },
                        "& h1": { fontSize: "1.5rem" },
                        "& h2": { fontSize: "1.25rem" },
                        "& h3": { fontSize: "1.1rem" },
                        "& p": { mb: 1.5, lineHeight: 1.6 },
                        "& ul, & ol": { pl: 3, mb: 1.5 },
                        "& li": { mb: 0.5 },
                        "& code": {
                          bgcolor: "action.hover",
                          px: 0.5,
                          borderRadius: 0.5,
                          fontFamily: "monospace",
                        },
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        // Reject embedded HTML that could execute or escape
                        // the dashboard frame; report content comes from a
                        // local LLM but defense-in-depth costs us nothing.
                        disallowedElements={["script", "iframe"]}
                        unwrapDisallowed={false}
                      >
                        {reportMarkdown}
                      </ReactMarkdown>
                    </Box>
                  )}
                </Box>
              </TabPanel>
            )}

            {/* Route Tab (conditional) */}
            {hasRoute && (
              <TabPanel value={activeTab} index={5}>
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
