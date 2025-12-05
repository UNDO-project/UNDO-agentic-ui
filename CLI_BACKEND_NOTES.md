# An Agentic System for Researching Surveillance Infrastructure

A multi-agent system for analyzing surveillance infrastructure and computing privacy-preserving walking routes in urban environments using OpenStreetMap data. The system operates completely locally without external APIs and provides both CLI and REST API interfaces.

## Overview

The pipeline consists of three main agents:

- **Scraper Agent**: Downloads surveillance camera data from OpenStreetMap via Overpass API
- **Analyzer Agent**: Enriches data using local LLM analysis and generates visualizations
- **Route Finder Agent**: Computes low-surveillance walking routes using k-shortest paths and spatial analysis

**Key Features:**
- **Privacy-focused routing**: Find walking routes that minimize camera exposure
- **Local LLM processing**: No external API calls - complete privacy
- **Dual interface**: Rich CLI and production-ready FastAPI REST API
- **Real-time updates**: WebSocket support for live pipeline progress
- **Intelligent caching**: Agent memory stores results to avoid redundant computation
- **Multiple analysis scenarios**: Configurable presets (basic, full, quick, report, mapping)
- **Comprehensive visualizations**: Heatmaps, hotspots, route maps, and statistical charts
- **Spatial optimization**: Efficient GeoDataFrame indexing for large camera datasets


## Usage

The system provides a rich CLI interface for running surveillance analysis:

### Basic Usage

```bash
# Analyze a city with basic settings
python main.py Berlin

# Specify country for disambiguation
python main.py Athens --country GR

# Use different analysis scenarios
python main.py Hamburg --scenario full
python main.py Munich --scenario quick
```

### Analysis Scenarios

- `basic` (default): Essential analysis producing key files
- `full`: Complete analysis with all visualizations and reports
- `quick`: Fast analysis with minimal processing
- `report`: Focus on statistical summaries and charts
- `mapping`: Emphasis on geospatial visualizations

### Low-Surveillance Routing

The system can compute privacy-preserving walking routes that minimize exposure to surveillance cameras. Routes are calculated using k-shortest paths algorithms and scored based on camera density within a configurable buffer radius.

**Basic Routing:**

```bash
# Compute a low-surveillance route between two coordinates
python main.py Lund \
  --country SE \
  --enable-routing \
  --start-lat 55.709400 \
  --start-lon 13.194381 \
  --end-lat 55.705962 \
  --end-lon 13.182304
```

**Using Existing Data:**

```bash
# Skip scraping and use cached camera data
python main.py Malmö \
  --country SE \
  --data-path overpass_data/malmö/malmö.json \
  --skip-scrape \
  --enable-routing \
  --start-lat 55.595650 \
  --start-lon 13.022659 \
  --end-lat 55.594801 \
  --end-lon 13.000557
```

**Routing Features:**
- **k-shortest paths**: Evaluates multiple candidate routes (default: 3)
- **Exposure scoring**: Cameras per kilometer metric for route comparison
- **Baseline comparison**: Shows how much safer the route is vs. shortest path
- **Interactive maps**: Folium-based HTML visualizations with route and cameras
- **Graph caching**: OSMnx pedestrian networks cached locally for fast re-computation
- **Result caching**: Routes cached in agent memory for identical requests

**Note:** First-time routing for a city will download the pedestrian network from OSM, which can take several minutes for large cities. Subsequent routes in the same city will be much faster.

### Advanced Options

```bash
# Skip scraping (use existing data)
python main.py Berlin --data-path overpass_data/berlin/berlin.json --skip-scrape

# Skip analysis (scraping only)
python main.py Hamburg --skip-analyze

# Custom output directory
python main.py Paris --output-dir /custom/path

# Verbose logging (helpful for debugging routing performance)
python main.py London --verbose

# Combine routing with full analysis
python main.py Berlin \
  --scenario full \
  --enable-routing \
  --start-lat 52.52 \
  --start-lon 13.40 \
  --end-lat 52.50 \
  --end-lon 13.42
```

### Output Files

The system generates files in `overpass_data/<city>/` organized by function:

**Analysis Outputs:**
- **Enriched JSON** (`<city>_enriched.json`): Original data enhanced with LLM analysis
- **GeoJSON** (`<city>_enriched.geojson`): Geographic data for mapping applications
- **Heatmap** (`<city>_heatmap.html`): Interactive spatial density visualization
- **Hotspots** (`hotspots_<city>.geojson`, `hotspot_plot_<city>.png`): DBSCAN clustering results
- **Statistics** (`stats_chart_<city>.png`): Summary charts and metrics

**Routing Outputs** (in `routes/` subdirectory):
- **Route GeoJSON** (`route_<hash>.geojson`): Route geometry with exposure metrics and nearby camera IDs
- **Route Map** (`route_<hash>.html`): Interactive Folium map with:
  - Low-surveillance route (blue line)
  - Start/end markers (green/red)
  - Camera coverage circles (semi-transparent red)
  - Route metrics tooltip (length, exposure score)

**Cache Files:**
- **OSM Graphs** (`.graph_cache/<hash>.graphml`): Cached pedestrian networks
- **Agent Memory** (`memory.db`): SQLite database storing route and query caches

## FastAPI Web Interface

In addition to the CLI, the system provides a production-ready REST API for programmatic access to all functionality.

### Running the API Server

**Development Mode:**
```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8080
```

**Production Mode:**
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8080 --workers 4
```

**Access Documentation:**
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`
- OpenAPI spec: `http://localhost:8080/openapi.json`

### API Features

- **Asynchronous execution**: Long-running jobs processed in background tasks
- **Real-time progress**: WebSocket endpoint for live pipeline updates
- **Task management**: Full CRUD operations on analysis jobs
- **File serving**: Direct access to generated GeoJSON, maps, and visualizations
- **Type safety**: Pydantic validation on all requests and responses
- **Auto-documentation**: Complete OpenAPI spec with interactive examples

### API Endpoints

#### Health & System

```http
GET /health
```
Returns service health status.

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T10:30:00Z",
  "service": "Agentic Surveillance Research API"
}
```

```http
GET /version
```
Returns API version information.

#### Pipeline Execution

```http
POST /api/v1/pipeline/run
```
Start a complete pipeline job (scraping + analysis + optional routing).

**Example Request:**
```json
{
  "city": "Berlin",
  "country": "DE",
  "scenario": "basic"
}
```

**With Routing:**
```json
{
  "city": "Lund",
  "country": "SE",
  "scenario": "full",
  "routing_config": {
    "city": "Lund",
    "country": "SE",
    "start_lat": 55.7047,
    "start_lon": 13.1910,
    "end_lat": 55.7058,
    "end_lon": 13.1932
  }
}
```

**Response:**
```json
{
  "task_id": "abc123",
  "status": "pending",
  "message": "Pipeline started for Berlin"
}
```

```http
GET /api/v1/pipeline/{task_id}
```
Get status and results for a pipeline job.

**Response (Running):**
```json
{
  "id": "abc123",
  "type": "pipeline",
  "status": "running",
  "progress": 50,
  "created_at": "2025-12-05T10:30:00Z",
  "started_at": "2025-12-05T10:30:01Z",
  "metadata": {
    "city": "Berlin",
    "scenario": "basic"
  }
}
```

**Response (Completed):**
```json
{
  "id": "abc123",
  "type": "pipeline",
  "status": "completed",
  "progress": 100,
  "result": {
    "city": "Berlin",
    "status": "completed",
    "scrape": { "success": true, "elements_count": 150 },
    "analyze": { "success": true, "element_count": 150 },
    "routing": { "success": true, "length_m": 1523.4, "exposure_score": 2.3 }
  },
  "created_at": "2025-12-05T10:30:00Z",
  "completed_at": "2025-12-05T10:32:15Z"
}
```

```http
POST /api/v1/pipeline/{task_id}/cancel
```
Cancel a running pipeline job.

```http
DELETE /api/v1/pipeline/{task_id}
```
Delete a pipeline job and its results.

#### File Outputs

```http
GET /api/v1/outputs/{city}/geojson?enriched=true
```
Download enriched GeoJSON file for a city.

```http
GET /api/v1/outputs/{city}/map?map_type=heatmap
```
Get interactive HTML heatmap. Options: `heatmap`, `hotspots`.

```http
GET /api/v1/outputs/{city}/route?format=map
```
Get route visualization. Formats: `map` (HTML), `geojson`.

```http
GET /api/v1/outputs/{city}/stats?format=json
```
Get statistics. Formats: `json`, `chart` (PNG).

```http
GET /api/v1/outputs/{city}/list
```
List all available files for a city with metadata.

**Example Response:**
```json
{
  "city": "Berlin",
  "file_count": 8,
  "files": [
    {
      "name": "Berlin_enriched.geojson",
      "path": "/outputs/Berlin_enriched.geojson",
      "size_bytes": 245678,
      "modified": 1733395200.0,
      "type": "application/geo+json"
    }
  ]
}
```

```http
GET /api/v1/outputs/file/{filename}
```
Generic file access by filename.

#### Real-Time Progress (WebSocket)

```http
WS /ws/tasks/{task_id}
```
WebSocket endpoint for real-time pipeline progress updates.

**Example Messages:**

```json
{
  "type": "progress",
  "stage": "scraping",
  "progress": 20,
  "message": "Downloading surveillance data from OpenStreetMap",
  "timestamp": "2025-12-05T10:30:05Z"
}
```

```json
{
  "type": "completed",
  "stage": "completed",
  "progress": 100,
  "message": "Pipeline completed successfully",
  "timestamp": "2025-12-05T10:32:15Z"
}
```

### API Usage Examples

#### Using curl

**Start a pipeline:**
```bash
curl -X POST http://localhost:8080/api/v1/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Berlin",
    "country": "DE",
    "scenario": "basic"
  }'
```

**Check status:**
```bash
curl http://localhost:8080/api/v1/pipeline/abc123
```

**Download GeoJSON:**
```bash
curl http://localhost:8080/api/v1/outputs/Berlin/geojson > berlin.geojson
```

#### Using Python

```python
import requests
import time

# Start pipeline
response = requests.post(
    "http://localhost:8080/api/v1/pipeline/run",
    json={
        "city": "Athens",
        "country": "GR",
        "scenario": "full",
        "routing_config": {
            "city": "Athens",
            "country": "GR",
            "start_lat": 37.9838,
            "start_lon": 23.7275,
            "end_lat": 37.9755,
            "end_lon": 23.7348
        }
    }
)
task_id = response.json()["task_id"]

# Poll for completion
while True:
    status = requests.get(f"http://localhost:8080/api/v1/pipeline/{task_id}").json()
    print(f"Progress: {status['progress']}%")

    if status["status"] in ["completed", "failed"]:
        break

    time.sleep(2)

# Get results
if status["status"] == "completed":
    results = status["result"]
    print(f"Route length: {results['routing']['length_m']}m")
    print(f"Exposure score: {results['routing']['exposure_score']} cameras/km")
```

#### Using JavaScript/WebSocket

```javascript
// Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:8080/ws/tasks/abc123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`${data.stage}: ${data.progress}%`);

  if (data.type === 'completed') {
    console.log('Pipeline finished!');
    ws.close();
  }
};

// Send periodic ping to keep connection alive
setInterval(() => ws.send('ping'), 5000);
```


