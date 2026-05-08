// src/types/api.d.ts

export type Scenario = "basic" | "full";
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type WebSocketMessageType = "progress" | "completed" | "error" | "log";

/**
 * Camera-set narrowing applied to routing exposure scoring.
 * Every field is optional. Omit the whole object — or send an empty one
 * — to consider every camera in the dataset.
 */
export interface CameraFilter {
  sensitive_only?: boolean;
  operators?: string[];
  surveillance_types?: string[];
}

export interface RoutingConfig {
  city: string;
  country?: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  camera_filter?: CameraFilter;
}

/**
 * Per-toggle overrides layered on top of the chosen scenario preset.
 * Every field is optional; only set fields are merged into the backend's
 * ``PipelineConfig``. An empty object keeps the preset baseline exactly.
 */
export interface OutputOverrides {
  generate_geojson?: boolean;
  compute_stats?: boolean;
  generate_chart?: boolean;
  generate_heatmap?: boolean;
  generate_hotspots?: boolean;
  plot_zone_sensitivity?: boolean;
  plot_sensitivity_reasons?: boolean;
  plot_hotspots?: boolean;
}

/**
 * Client-side filter applied to enriched-camera features in the
 * Camera Map tab (Frontend #3). Distinct from ``CameraFilter`` above
 * which is the routing-payload shape mirroring the backend.
 *
 * - ``operators``: empty array means "all operators".
 * - ``privacy``: each flag controls visibility of one bucket;
 *   ``unknown`` covers features whose ``public`` is null/undefined.
 * - ``sensitivity``: tri-state across ``sensitive`` boolean.
 */
export interface MapCameraFilter {
  operators: string[];
  privacy: { public: boolean; private: boolean; unknown: boolean };
  sensitivity: "all" | "sensitive" | "non-sensitive";
}

export interface PipelineRequest {
  city: string;
  country?: string;
  scenario: Scenario;
  overrides?: OutputOverrides;
  routing_config?: RoutingConfig;
  force_refresh?: boolean;
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
    /** Cameras within the route buffer after any camera_filter was applied. */
    camera_count_near_route?: number;
    /** Total cameras considered post-filter (the "Y" in "X of Y considered"). */
    camera_count_total?: number;
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
