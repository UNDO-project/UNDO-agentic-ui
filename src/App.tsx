import { useState, useEffect } from "react";
import PipelineConfig from "./components/form/PipelineConfig";
import ProgressMonitor from "./components/monitor/ProgressMonitor";
import Dashboard from "./components/dashboard/Dashboard";
import type { PipelineRequest, TaskResponse } from "./types/api";
import { startPipeline } from "./api/pipeline";
import { useSnackbar } from "./hooks/useSnackbar";

type AppView = "config" | "monitor" | "dashboard";

const LAST_TASK_KEY = "lastCompletedTask";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("config");
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cityForResults, setCityForResults] = useState<string | null>(null);

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
      setTaskId(response.task_id);
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
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

export default App;
