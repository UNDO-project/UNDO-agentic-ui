// src/components/monitor/ProgressMonitor.tsx
import React, { useState, useEffect, useCallback } from "react";
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
import useWebSocket, { WebSocketReadyState } from "../../hooks/useWebSocket";
import Terminal from "./Terminal";
import PipelineStepper from "./PipelineStepper";
import type { WebSocketMessage } from "../../types/api";

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
  const [logs, setLogs] = useState<WebSocketMessage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("Initialization");
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Add to logs
    setLogs((prev) => [...prev, message]);

    // Update stage
    if (message.stage) {
      setCurrentStage(message.stage);
    }

    // Update progress
    if (typeof message.progress === "number") {
      setProgress(message.progress);
    }

    // Check for completion or error
    if (message.type === "completed") {
      setIsComplete(true);
      setProgress(100);
      setCurrentStage("Completion");
    } else if (message.type === "error") {
      setError(message.message);
    }
  }, []);

  // Construct WebSocket URL.
  // Hardcoding localhost:8080 for dev as per plan context.
  const wsUrl = `ws://localhost:8080/ws/tasks/${taskId}`;

  const { readyState, error: wsError } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (wsError) {
      console.error("WebSocket error:", wsError);
    }
  }, [wsError]);

  const connectionStatus = {
    [WebSocketReadyState.CONNECTING]: "Connecting...",
    [WebSocketReadyState.OPEN]: "Connected",
    [WebSocketReadyState.CLOSING]: "Closing...",
    [WebSocketReadyState.CLOSED]: "Disconnected",
  }[readyState];

  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="mb-6 flex items-center justify-between">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          variant="outlined"
          color="inherit"
        >
          Back to Config
        </Button>
        <Box className="text-right">
          <Typography
            variant="overline"
            display="block"
            className="text-gray-500"
          >
            Task ID: {taskId}
          </Typography>
          <Typography
            variant="caption"
            className={`${
              readyState === WebSocketReadyState.OPEN
                ? "text-green-600"
                : "text-orange-500"
            }`}
          >
            ● {connectionStatus}
          </Typography>
        </Box>
      </Box>

      <Paper className="p-6 mb-6">
        <Typography variant="h5" className="mb-4 font-semibold">
          Scan Progress for {city}
        </Typography>

        <PipelineStepper currentStage={currentStage} />

        <Box className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          className="mb-4 rounded h-2"
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

      <Terminal logs={logs} />
    </Container>
  );
};

export default ProgressMonitor;
