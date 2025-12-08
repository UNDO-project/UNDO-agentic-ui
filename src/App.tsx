import { useState } from "react";
import PipelineConfig from "./components/form/PipelineConfig";
import ProgressMonitor from "./components/monitor/ProgressMonitor";
import Dashboard from "./components/dashboard/Dashboard";
import type { PipelineRequest, TaskResponse } from "./types/api";
import { startPipeline } from "./api/pipeline";
import { ThemeProvider } from "@mui/material/styles";
import getAppTheme from "./theme";
import { CssBaseline } from "@mui/material";

type AppView = "config" | "monitor" | "dashboard";

function App() {
  const [currentView, setCurrentView] = useState<AppView>("config");
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cityForResults, setCityForResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For MUI theme (light/dark mode can be toggled by user later)
  const theme = getAppTheme("dark");

  const handleStartScan = async (request: PipelineRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: TaskResponse = await startPipeline(request);
      setTaskId(response.task_id);
      setCityForResults(request.city);
      setCurrentView("monitor"); // Switch to monitor view
    } catch (err) {
      console.error("Failed to start pipeline:", err);
      setError("Failed to start pipeline. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToConfig = () => {
    setTaskId(null);
    setCityForResults(null);
    setError(null);
    setCurrentView("config"); // Switch back to config view
  };

  const handleMonitorComplete = () => {
    // This is called when the monitor indicates the task is complete
    setCurrentView("dashboard"); // Switch to dashboard view
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply theme background */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        {error && (
          <div className="absolute z-50 p-3 text-white bg-red-500 rounded shadow-md top-4 right-4">
            {error}
          </div>
        )}

        {currentView === "config" && (
          <PipelineConfig onStartScan={handleStartScan} isLoading={isLoading} />
        )}

        {currentView === "monitor" && taskId && cityForResults && (
          <ProgressMonitor
            taskId={taskId}
            city={cityForResults} // Pass city to ProgressMonitor
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
    </ThemeProvider>
  );
}

export default App;
