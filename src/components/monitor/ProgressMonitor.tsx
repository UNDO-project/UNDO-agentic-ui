// src/components/monitor/ProgressMonitor.tsx
import React, { useState, useEffect, useRef } from "react";
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

const POLL_INTERVAL_MS = 1500;
const TICKER_INTERVAL_MS = 1000;
// Polls failing for longer than this downgrade the connection badge to
// a "stalled" state. Reverts on the next successful poll.
const CONNECTION_STALE_MS = 5000;
// Backend stalls past this surface an advisory "still working" caption.
// Longer than typical analysis steps but short enough to catch stuck runs.
const BACKEND_STALL_THRESHOLD_MS = 90000;

/** Format a millisecond duration as "Hh Mm Ss", trimming leading zero parts. */
function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

interface ProgressMonitorProps {
  taskId: string;
  city: string; // Added city prop
  /**
   * Whether the user enabled routing for this run. Drives the
   * "Routing / Skipped" rendering in PipelineStepper. Sourced from the
   * submitted request in ScanWorkflow — authoritative since the form is
   * what decides whether routing runs at all.
   */
  routingEnabled: boolean;
  onComplete: () => void;
  onBack: () => void;
}

const ProgressMonitor: React.FC<ProgressMonitorProps> = ({
  taskId,
  city, // Destructure city prop
  routingEnabled,
  onComplete,
  onBack,
}) => {
  const [currentStage, setCurrentStage] = useState<string>("Initialization");
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [elementsCount, setElementsCount] = useState<number | null>(null);
  const [analysisSkipped, setAnalysisSkipped] = useState<boolean>(false);
  // Per-batch analyzer progress. Both null until the first batch
  // finishes and the backend populates the metadata fields.
  const [enrichedCount, setEnrichedCount] = useState<number | null>(null);
  const [enrichedTotal, setEnrichedTotal] = useState<number | null>(null);

  // Live "still running" indicator state. ``now`` is bumped by a 1s ticker
  // so elapsed-time and staleness derivations re-render once per second
  // independent of the 1.5s poll cadence. ``runStartedAt`` anchors the
  // elapsed counter to a fixed wall-clock instant so freezing the ticker
  // on completion preserves the final duration.
  const [now, setNow] = useState<number>(() => Date.now());
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);

  // Refs so updating these inside pollStatus doesn't trigger renders.
  const lastSuccessfulPollAtRef = useRef<number>(Date.now());
  const lastChangeAtRef = useRef<number>(Date.now());
  const lastSeenProgressRef = useRef<number | null>(null);
  const lastSeenMessageRef = useRef<string | null>(null);

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
          // Successful round-trip — clear any "connection stalled" state.
          lastSuccessfulPollAtRef.current = Date.now();

          // Update progress
          if (status.progress !== undefined) {
            setProgress(status.progress);
          }

          // Update stage from metadata.last_message (where backend puts it)
          const stageMessage = status.metadata?.last_message || status.message;
          if (stageMessage) {
            setCurrentStage(stageMessage);
          }

          // Backend-side stall detection: refresh the "last change" timestamp
          // only when ``progress`` or ``last_message`` actually moved. If
          // either keeps changing the caption stays hidden.
          const polledMessage = status.metadata?.last_message ?? null;
          const polledProgress = status.progress ?? null;
          if (
            polledProgress !== lastSeenProgressRef.current ||
            polledMessage !== lastSeenMessageRef.current
          ) {
            lastSeenProgressRef.current = polledProgress;
            lastSeenMessageRef.current = polledMessage;
            lastChangeAtRef.current = Date.now();
          }

          // Anchor the elapsed-time counter to ``status.started_at`` once
          // available, so the display matches the backend's notion of
          // "when did this run start" rather than the mount time.
          if (runStartedAt === null) {
            const startedAt = status.started_at
              ? new Date(status.started_at).getTime()
              : Date.now();
            if (!Number.isNaN(startedAt)) {
              setRunStartedAt(startedAt);
            }
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

          // Per-batch analyzer progress. Backend populates these once
          // per chunk so the caption refines within ≤ 1.5s of each
          // batch landing. Absent on scraping, analyzer-skip, and
          // cache-hit paths.
          if (typeof status.metadata?.enriched_count === "number") {
            setEnrichedCount(status.metadata.enriched_count);
          }
          if (typeof status.metadata?.enriched_total === "number") {
            setEnrichedTotal(status.metadata.enriched_total);
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
          // Don't bump lastSuccessfulPollAtRef — the staleness ticker
          // will surface the connection-stalled badge once it crosses
          // CONNECTION_STALE_MS.
          console.error("Polling failed:", err);
        }
      };

      // Poll immediately
      pollStatus();

      // Then poll every POLL_INTERVAL_MS milliseconds
      intervalId = setInterval(pollStatus, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isComplete, error, taskId, runStartedAt]);

  // 1s ticker driving elapsed-time + staleness derivations. Stops as
  // soon as the run terminates (completion, failure, cancellation) so
  // the elapsed counter freezes at its final value rather than drifting.
  useEffect(() => {
    if (isComplete || error) return;
    const tickerId = setInterval(() => {
      setNow(Date.now());
    }, TICKER_INTERVAL_MS);
    return () => clearInterval(tickerId);
  }, [isComplete, error, taskId]);

  // Reset run-state when the task ID changes — protects against the
  // (unusual) case of the same component instance being reused for a
  // new task; without this the elapsed counter would carry over.
  useEffect(() => {
    setRunStartedAt(null);
    setNow(Date.now());
    setEnrichedCount(null);
    setEnrichedTotal(null);
    lastSuccessfulPollAtRef.current = Date.now();
    lastChangeAtRef.current = Date.now();
    lastSeenProgressRef.current = null;
    lastSeenMessageRef.current = null;
  }, [taskId]);

  // Derived "still running" indicators. All three re-evaluate once per
  // second via the ticker effect above.
  const isRunning = !isComplete && !error;
  const elapsedMs = runStartedAt !== null ? Math.max(0, now - runStartedAt) : 0;
  const connectionStale =
    isRunning && now - lastSuccessfulPollAtRef.current > CONNECTION_STALE_MS;
  const backendStalled =
    isRunning &&
    runStartedAt !== null &&
    now - lastChangeAtRef.current > BACKEND_STALL_THRESHOLD_MS;

  const connectionStatus = connectionStale
    ? "⚠ Connection stalled — retrying…"
    : "● Polling (every 1.5s)";

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
          <Typography
            variant="caption"
            className={connectionStale ? "text-amber-500" : "text-blue-500"}
            data-testid="connection-status"
          >
            {connectionStatus}
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
          isComplete={isComplete}
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
            ) : isComplete ? (
              <>
                Analyzed <strong>{elementsCount}</strong> cameras.
              </>
            ) : enrichedCount !== null && enrichedTotal !== null ? (
              <>
                Analyzing <strong>{enrichedCount}</strong>/
                <strong>{enrichedTotal}</strong> cameras…
              </>
            ) : (
              <>
                Analyzing <strong>{elementsCount}</strong> cameras…
              </>
            )}
          </Typography>
        )}

        {backendStalled && (
          <Typography
            variant="body2"
            className="mb-2 text-amber-500"
            data-testid="backend-stalled-caption"
          >
            Still working — no progress update yet.
          </Typography>
        )}

        <Box className="flex justify-between mb-2 text-sm text-gray-600">
          <span>
            Progress
            {runStartedAt !== null && (
              <span className="ml-3 text-gray-500" data-testid="elapsed-time">
                · Running for {formatDuration(elapsedMs)}
              </span>
            )}
          </span>
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
