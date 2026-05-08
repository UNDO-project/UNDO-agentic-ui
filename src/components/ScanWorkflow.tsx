import { useState, useEffect } from "react";
import PipelineConfig from "./form/PipelineConfig";
import ProgressMonitor from "./monitor/ProgressMonitor";
import Dashboard from "./dashboard/Dashboard";
import type { PipelineRequest, TaskResponse } from "../types/api";
import { startPipeline } from "../api/pipeline";
import { useSnackbar } from "../hooks/useSnackbar";

type AppView = "config" | "monitor" | "dashboard";

const LAST_TASK_KEY = "lastCompletedTask";

function ScanWorkflow() {
  const [currentView, setCurrentView] = useState<AppView>("config");
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cityForResults, setCityForResults] = useState<string | null>(null);
  // Tracks whether the user enabled routing for the in-flight run so the
  // ProgressMonitor stepper can render the Routing step as "Skipped" up
  // front instead of leaving it pending until completion. Only meaningful
  // for runs we just kicked off — completed runs go straight to the
  // dashboard and never mount ProgressMonitor.
  const [routingEnabledForRun, setRoutingEnabledForRun] =
    useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  // Load last task from localStorage on mount
  useEffect(() => {
    const savedTask = localStorage.getItem(LAST_TASK_KEY);
    if (savedTask) {
      const { taskId: savedTaskId, city: savedCity } = JSON.parse(savedTask);
      setTaskId(savedTaskId);
      setCityForResults(savedCity);
    }
  }, []);

  const handleStartScan = async (request: PipelineRequest) => {
    setIsLoading(true);
    try {
      const response: TaskResponse = await startPipeline(request);
      setTaskId(response.task_id ?? response.id ?? null);
      setCityForResults(request.city);
      setRoutingEnabledForRun(request.routing_config !== undefined);
      setCurrentView("monitor"); // Switch to monitor view
      showSnackbar("Pipeline started successfully!", "success");
    } catch (err) {
      console.error("Failed to start pipeline:", err);
      showSnackbar(
        "Failed to start pipeline. Check console for details.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToConfig = () => {
    setCurrentView("config"); // Switch back to config view
  };

  const handleMonitorComplete = () => {
    // Save completed task to localStorage
    if (taskId && cityForResults) {
      localStorage.setItem(
        LAST_TASK_KEY,
        JSON.stringify({ taskId, city: cityForResults }),
      );
    }
    // This is called when the monitor indicates the task is complete
    setCurrentView("dashboard"); // Switch to dashboard view
    showSnackbar("Scan completed! Viewing results.", "success");
  };

  const handleViewLastResults = () => {
    if (taskId && cityForResults) {
      setCurrentView("dashboard");
    }
  };

  const hasLastResults = taskId && cityForResults;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {currentView === "config" && (
        <PipelineConfig
          onStartScan={handleStartScan}
          isLoading={isLoading}
          onViewLastResults={hasLastResults ? handleViewLastResults : undefined}
          lastResultsCity={hasLastResults ? cityForResults : undefined}
        />
      )}

      {currentView === "monitor" && taskId && cityForResults && (
        <ProgressMonitor
          taskId={taskId}
          city={cityForResults}
          routingEnabled={routingEnabledForRun}
          onBack={handleBackToConfig}
          onComplete={handleMonitorComplete}
        />
      )}

      {currentView === "dashboard" && taskId && cityForResults && (
        <Dashboard
          taskId={taskId}
          city={cityForResults}
          onBackToConfig={handleBackToConfig}
        />
      )}
    </div>
  );
}

export default ScanWorkflow;
