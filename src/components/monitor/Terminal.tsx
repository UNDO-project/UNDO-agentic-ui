// src/components/monitor/Terminal.tsx
import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

interface TerminalProps {
  logs: string[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Box
      className="w-full p-4 overflow-hidden bg-gray-900 rounded-lg shadow-inner"
      sx={{ height: "400px", display: "flex", flexDirection: "column" }}
    >
      <Typography
        variant="caption"
        className="block mb-2 font-mono text-gray-400 uppercase border-b border-gray-700"
      >
        Live Pipeline Logs
      </Typography>
      <Box className="flex-1 overflow-y-auto font-mono text-sm text-green-400">
        {logs.length === 0 ? (
          <span className="text-gray-600 italic">Waiting for logs...</span>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="break-all whitespace-pre-wrap">
              <span className="mr-2 text-gray-600">$</span>
              {log}
            </div>
          ))
        )}
        <div ref={endRef} />
      </Box>
    </Box>
  );
};

export default Terminal;
