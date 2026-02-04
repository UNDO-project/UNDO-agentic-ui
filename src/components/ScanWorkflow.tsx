import { useState } from "react";
import PipelineConfig from "./form/PipelineConfig";
import ProgressMonitor from "./monitor/ProgressMonitor";
import Dashboard from "./dashboard/Dashboard";
import type { PipelineRequest, TaskResponse } from "../types/api";
import { startPipeline } from "../api/pipeline";
import { useSnackbar } from "../hooks/useSnackbar";

type AppView = "config" | "monitor" | "dashboard";

function ScanWorkflow() {
  const [currentView, setCurrentView] = useState<AppView>("config");
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cityForResults, setCityForResults] = useState<string | null>(null);

  const { showSnackbar } = useSnackbar();

  const handleStartScan = async (request: PipelineRequest) => {
    setIsLoading(true);
    try {
      const response: TaskResponse = await startPipeline(request);
      setTaskId(response.task_id ?? response.id ?? null);
      setCityForResults(request.city);
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
    setTaskId(null);
    setCityForResults(null);
    setCurrentView("config"); // Switch back to config view
  };

  const handleMonitorComplete = () => {
    // This is called when the monitor indicates the task is complete
    setCurrentView("dashboard"); // Switch to dashboard view
    showSnackbar("Scan completed! Viewing results.", "success");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {currentView === "config" && (
        <PipelineConfig onStartScan={handleStartScan} isLoading={isLoading} />
      )}

      {currentView === "monitor" && taskId && cityForResults && (
        <ProgressMonitor
          taskId={taskId}
          city={cityForResults}
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
