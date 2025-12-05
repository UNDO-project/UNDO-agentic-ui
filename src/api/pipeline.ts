// src/api/pipeline.ts
import api from "./axios";
import { PipelineRequest, TaskResponse } from "../types/api";

export const startPipeline = async (
  request: PipelineRequest,
): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>("/pipeline/run", request);
  return response.data;
};

export const getPipelineStatus = async (
  taskId: string,
): Promise<TaskResponse> => {
  const response = await api.get<TaskResponse>(`/pipeline/${taskId}`);
  return response.data;
};

export const cancelPipeline = async (taskId: string): Promise<TaskResponse> => {
  const response = await api.post<TaskResponse>(`/pipeline/${taskId}/cancel`);
  return response.data;
};

export const deletePipeline = async (taskId: string): Promise<TaskResponse> => {
  const response = await api.delete<TaskResponse>(`/pipeline/${taskId}`);
  return response.data;
};
