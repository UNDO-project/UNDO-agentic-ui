// src/components/monitor/PipelineStepper.tsx
import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  type StepIconProps,
  styled,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutorenewIcon from "@mui/icons-material/Autorenew";

const steps = [
  "Initialization",
  "Scraping",
  "Analysis",
  "Routing",
  "Completion",
];

interface PipelineStepperProps {
  currentStage: string;
  routingEnabled?: boolean; // Whether routing is part of this pipeline
  isComplete?: boolean; // Whether the pipeline has finished successfully
}

// Custom Step Icon to show spinning animation for active step
const StepIconRoot = styled("div")<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.text.disabled,
    display: "flex",
    height: 22,
    alignItems: "center",
    ...(ownerState.active && {
      color: theme.palette.primary.main,
    }),
    "& .QontoStepIcon-completedIcon": {
      color: theme.palette.success.main,
      zIndex: 1,
      fontSize: 24,
    },
    "& .QontoStepIcon-circle": {
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "currentColor",
    },
  }),
);

function CustomStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  return (
    <StepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <CheckCircleIcon className="QontoStepIcon-completedIcon" />
      ) : active ? (
        <AutorenewIcon
          className="animate-spin"
          sx={{ fontSize: 24, color: "#1976d2" }}
        />
      ) : (
        <RadioButtonUncheckedIcon sx={{ fontSize: 24 }} />
      )}
    </StepIconRoot>
  );
}

const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  routingEnabled = true,
  isComplete = false,
}) => {
  // Helper to map backend stage strings to step index
  const getActiveStep = (stage: string) => {
    const normalizedStage = stage.toLowerCase();
    if (normalizedStage.includes("init") || normalizedStage.includes("pend"))
      return 0;
    if (
      normalizedStage.includes("scrap") ||
      normalizedStage.includes("download")
    )
      return 1;
    if (
      normalizedStage.includes("analy") ||
      normalizedStage.includes("enrich") ||
      normalizedStage.includes("llm")
    )
      return 2;
    if (normalizedStage.includes("rout") || normalizedStage.includes("path"))
      return 3;
    if (
      normalizedStage.includes("complet") ||
      normalizedStage.includes("done") ||
      normalizedStage.includes("finished")
    )
      return 4; // Completion step
    return 0;
  };

  // When the run is complete, push activeStep past the last index so MUI
  // marks every step (including "Completion") as done. Without this the
  // final step stays "active" and renders the spinner instead of a tick.
  const activeStep = isComplete ? steps.length : getActiveStep(currentStage);

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => {
          // Skip routing step if not enabled (and not after completion —
          // once done, the uniform tick row reads better than a "Skipped"
          // caption).
          if (label === "Routing" && !routingEnabled && !isComplete) {
            return (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={CustomStepIcon}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      Skipped
                    </Typography>
                  }
                >
                  {label}
                </StepLabel>
              </Step>
            );
          }

          return (
            <Step key={label}>
              <StepLabel StepIconComponent={CustomStepIcon}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default PipelineStepper;
