// src/types/api.d.ts

export type Scenario = "basic" | "full" | "quick" | "report" | "mapping";
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type WebSocketMessageType = "progress" | "completed" | "error" | "log";

export interface RoutingConfig {
  city: string;
  country?: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
}

export interface PipelineRequest {
  city: string;
  country?: string;
  scenario: Scenario;
  routing_config?: RoutingConfig;
}

export interface TaskResult {
  city: string;
  status: TaskStatus;
  scrape: { success: boolean; elements_count?: number };
  analyze: { success: boolean; element_count?: number };
  routing?: { success: boolean; length_m: number; exposure_score: number };
  // Add other result fields as they become relevant
}

export interface TaskResponse {
  task_id: string;
  status: TaskStatus;
  message?: string;
  progress?: number; // 0-100%
  created_at: string;
  started_at?: string;
  completed_at?: string;
  metadata?: {
    city: string;
    scenario: Scenario;
    // Add other metadata fields
  };
  result?: TaskResult;
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  stage: string;
  progress?: number;
  message: string;
  timestamp: string;
  // Potentially add more detailed data depending on message type
}

// GeoJSON Specific Types
export interface RouteProperties {
  risk_score?: number;
  // Add any other properties expected in route GeoJSON features
}

// Outputs related types
export interface OutputFile {
  name: string;
  path: string;
  size_bytes: number;
  modified: number; // Unix timestamp
  type: string; // MIME type or custom type
}

export interface CityOutputsResponse {
  city: string;
  file_count: number;
  files: OutputFile[];
}
