// src/components/monitor/ProgressMonitor.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Alert,
  Container,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getPipelineStatus, cancelPipeline } from "../../api/pipeline";
import { useSnackbar } from "../../hooks/useSnackbar";
import PipelineStepper from "./PipelineStepper";

interface ProgressMonitorProps {
  taskId: string;
  city: string; // Added city prop
  onComplete: () => void;
  onBack: () => void;
}

const ProgressMonitor: React.FC<ProgressMonitorProps> = ({
  taskId,
  city, // Destructure city prop
  onComplete,
  onBack,
}) => {
  const [currentStage, setCurrentStage] = useState<string>("Initialization");
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [routingEnabled, setRoutingEnabled] = useState<boolean>(true);
  const [elementsCount, setElementsCount] = useState<number | null>(null);
  const [analysisSkipped, setAnalysisSkipped] = useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  // Polling-based status updates
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // Poll if task is running
    if (!isComplete && !error) {
      // Initial poll
      const pollStatus = async () => {
        try {
          const status = await getPipelineStatus(taskId);

          // Update progress
          if (status.progress !== undefined) {
            setProgress(status.progress);
          }

          // Update stage from metadata.last_message (where backend puts it)
          const stageMessage = status.metadata?.last_message || status.message;
          if (stageMessage) {
            setCurrentStage(stageMessage);
          }

          // Check if routing is enabled (if metadata provides this info)
          if (status.metadata?.routing_enabled !== undefined) {
            setRoutingEnabled(status.metadata.routing_enabled);
          }
          // Fallback: check if result has routing data
          if (status.result?.routing !== undefined) {
            setRoutingEnabled(true);
          }

          // Element count + analyzer-skip signal.
          // Both are populated by the backend the moment scrape returns,
          // so they show up here within ~1.5s of the analyzer transition.
          if (typeof status.metadata?.elements_count === "number") {
            setElementsCount(status.metadata.elements_count);
          }
          if (typeof status.metadata?.analysis_skipped === "boolean") {
            setAnalysisSkipped(status.metadata.analysis_skipped);
          }

          // Check for completion
          if (status.status === "completed") {
            setIsComplete(true);
            setProgress(100);
            setCurrentStage("Completed");
          } else if (status.status === "failed") {
            setError(status.error || status.message || "Task failed");
          } else if (status.status === "cancelled") {
            setError("Task cancelled");
          }
        } catch (err) {
          console.error("Polling failed:", err);
        }
      };

      // Poll immediately
      pollStatus();

      // Then poll every 1.5 seconds
      intervalId = setInterval(pollStatus, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isComplete, error, taskId]);

  const connectionStatus = "Polling (every 1.5s)";

  const handleCancel = async () => {
    if (isCancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this scan? This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await cancelPipeline(taskId);
      showSnackbar("Pipeline cancellation requested", "info");
      setError("Task cancelled by user");
    } catch (err) {
      console.error("Failed to cancel pipeline:", err);
      showSnackbar("Failed to cancel pipeline", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="flex items-center justify-between mb-6">
        <Box className="flex gap-2">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
            color="inherit"
          >
            Back to Config
          </Button>
          {!isComplete && !error && (
            <Button
              onClick={handleCancel}
              variant="outlined"
              color="error"
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Scan"}
            </Button>
          )}
        </Box>
        <Box className="text-right">
          <Typography
            variant="overline"
            display="block"
            className="text-gray-500"
          >
            Task ID: {taskId}
          </Typography>
          <Typography variant="caption" className="text-blue-500">
            ● {connectionStatus}
          </Typography>
        </Box>
      </Box>

      <Paper className="p-6 mb-6">
        <Typography variant="h5" className="mb-4 font-semibold">
          Scan Progress for {city}
        </Typography>

        <PipelineStepper
          currentStage={currentStage}
          routingEnabled={routingEnabled}
        />

        {elementsCount !== null && (
          <Typography
            variant="body2"
            className="mb-2 text-gray-400"
            data-testid="elements-count-caption"
          >
            {analysisSkipped ? (
              <>
                Reusing prior analysis of <strong>{elementsCount}</strong>{" "}
                cameras.
              </>
            ) : (
              <>
                Analyzing <strong>{elementsCount}</strong> cameras…
              </>
            )}
          </Typography>
        )}

        <Box className="flex justify-between mb-2 text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          className="h-2 mb-4 rounded"
          color={error ? "error" : isComplete ? "success" : "primary"}
        />

        {error && (
          <Alert severity="error" className="mb-4">
            Scan Failed: {error}
          </Alert>
        )}

        {isComplete && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            className="mb-4"
            action={
              <Button color="inherit" size="small" onClick={onComplete}>
                View Results
              </Button>
            }
          >
            Scan Completed Successfully!
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ProgressMonitor;
