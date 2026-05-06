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
  routing?: {
    success: boolean;
    length_m: number;
    exposure_score: number;
    route_id?: string;
  };
  // Add other result fields as they become relevant
}

export interface TaskResponse {
  id?: string; // Backend returns 'id' instead of 'task_id' in status responses
  task_id?: string; // Used in creation response
  type?: string; // Backend includes 'type: "pipeline"'
  status: TaskStatus;
  message?: string; // Used in creation response
  progress?: number; // 0-100%
  error?: string | null;
  created_at: string;
  started_at?: string;
  completed_at?: string | null;
  metadata?: {
    city: string;
    country?: string | null;
    scenario: Scenario;
    last_message?: string; // Current stage message from backend
    routing_enabled?: boolean;
    /**
     * Number of OSM elements (cameras) the analyzer will process.
     * Populated by the backend the moment scrape returns, before the
     * analyzer stage starts; persists through completion.
     */
    elements_count?: number;
    /**
     * True when the orchestrator is reusing prior enriched outputs
     * (probe-and-compare cache hit on identical scrape data). The
     * element count still reflects how many cameras are in the reused
     * dataset.
     */
    analysis_skipped?: boolean;
    /**
     * Number of cameras the analyzer has enriched so far. Populated
     * once per analyzer batch (every few seconds). Mid-run only —
     * absent during scraping and on the cache-hit / skip paths.
     */
    enriched_count?: number;
    /**
     * Total cameras to enrich for this run. Mirrors ``elements_count``
     * but pairs naturally with ``enriched_count`` for caption rendering.
     */
    enriched_total?: number;
  };
  result?: TaskResult | null;
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
