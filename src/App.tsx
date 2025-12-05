import React, { useState } from "react";
import PipelineConfig from "./components/form/PipelineConfig";
import { PipelineRequest, TaskResponse } from "./types/api";
import { startPipeline } from "./api/pipeline";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartScan = async (request: PipelineRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: TaskResponse = await startPipeline(request);
      setTaskId(response.task_id);
      // In a real app, you'd navigate to /processing/{response.task_id}
      console.log("Pipeline started:", response);
    } catch (err) {
      console.error("Failed to start pipeline:", err);
      setError("Failed to start pipeline. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded shadow-md">
          {error}
        </div>
      )}
      {taskId ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Pipeline Started!</h2>
          <p>Task ID: {taskId}</p>
          <p>Navigate to `/processing/{taskId}` to monitor progress.</p>
        </div>
      ) : (
        <PipelineConfig onStartScan={handleStartScan} isLoading={isLoading} />
      )}
    </div>
  );
}

export default App;
