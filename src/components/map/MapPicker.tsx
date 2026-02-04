// src/components/map/MapPicker.tsx
import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography } from "@mui/material";

// Fix for default marker icon issues with Webpack/Vite
interface LeafletIconDefaultPrototype {
  _getIconUrl?: (name: string) => string;
}
delete (L.Icon.Default.prototype as LeafletIconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
});

interface MapPickerProps {
  onPointsChange: (
    start: { lat: number; lon: number } | null,
    end: { lat: number; lon: number } | null,
  ) => void;
  initialStart: { lat: number; lon: number } | null;
  initialEnd: { lat: number; lon: number } | null;
}

const MapEventsHandler: React.FC<{
  onMapClick: (latlng: L.LatLng) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({
  onPointsChange,
  initialStart,
  initialEnd,
}) => {
  // clickPhase determines whether the next click sets the start or end point.
  // It's local state to MapPicker as it only concerns user interaction within the map.
  const [clickPhase, setClickPhase] = useState(() => {
    if (!initialStart && !initialEnd) {
      return 0; // If both null, next click sets start
    } else if (initialStart && !initialEnd) {
      return 1; // If only start set, next click sets end
    } else {
      // if both initialStart and initialEnd are set (or only initialEnd is set, though that's less likely in a clean flow)
      return 0; // If both set, next click overwrites start
    }
  });

  const handleMapClick = useCallback(
    (latlng: L.LatLng) => {
      let newStart = initialStart;
      let newEnd = initialEnd;

      if (clickPhase === 0) {
        newStart = { lat: latlng.lat, lon: latlng.lng };
        newEnd = null; // Clear end point when setting a new start if a new start is picked
        setClickPhase(1); // Next click will set end
      } else {
        newEnd = { lat: latlng.lat, lon: latlng.lng };
        setClickPhase(0); // Next click will set start
      }

      onPointsChange(newStart, newEnd); // Update parent immediately
    },
    [onPointsChange, initialStart, initialEnd, clickPhase],
  );

  const greenIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <Box className="relative w-full h-full">
      <MapContainer
        center={[62.0, 15.0]} // Default center (Nordics - central Sweden/Norway)
        zoom={5}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "300px",
          borderRadius: "8px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {initialStart && (
          <Marker
            position={[initialStart.lat, initialStart.lon]}
            icon={greenIcon}
          />
        )}
        {initialEnd && (
          <Marker position={[initialEnd.lat, initialEnd.lon]} icon={redIcon} />
        )}
        <MapEventsHandler onMapClick={handleMapClick} />
      </MapContainer>

      <Box className="absolute top-2 right-2 z-[1000] bg-white/90 p-2 rounded shadow text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
          <span>
            Next Click: {clickPhase === 0 ? "Start Point" : "End Point"}
          </span>
        </div>
        <Typography variant="caption" display="block">
          {initialStart ? "✅ Start set" : "❌ Start missing"} |{" "}
          {initialEnd ? "✅ End set" : "❌ End missing"}
        </Typography>
      </Box>
    </Box>
  );
};

export default MapPicker;
