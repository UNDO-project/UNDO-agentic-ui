import React, { useEffect, useRef } from "react";
import type { WebSocketMessage } from "../../types/api";

interface TerminalProps {
  logs: WebSocketMessage[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-gray-900 text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto shadow-inner border border-gray-700">
      {logs.length === 0 && (
        <div className="text-gray-500 italic text-center mt-4">
          Waiting for connection...
        </div>
      )}
      {logs.map((log, index) => (
        <div key={index} className="mb-1 break-words text-sm">
          <span className="text-gray-500 mr-2">
            [{new Date(log.timestamp).toLocaleTimeString()}]
          </span>
          <span
            className={`
            ${log.type === "error" ? "text-red-500" : ""}
            ${log.type === "completed" ? "text-blue-400" : ""}
            ${log.type === "progress" ? "text-yellow-300" : ""}
          `}
          >
            {log.stage && (
              <span className="font-bold mr-2 uppercase text-xs tracking-wider text-purple-400">
                [{log.stage}]
              </span>
            )}
            {log.message}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default Terminal;
