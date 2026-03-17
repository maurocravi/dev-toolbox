"use client";

import type { TimeLog } from "../types";

interface LogListProps {
  logs: TimeLog[];
  onDeleteLog: (id: string) => void;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTimeOfDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTotalDuration(logs: TimeLog[]): number {
  return logs.reduce((acc, log) => acc + log.duration, 0);
}

export default function LogList({ logs, onDeleteLog }: LogListProps) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-sm text-neutral-500">
          No hay registros hoy.
          <br />
          <span className="text-neutral-600">
            Inicia el timer para empezar a registrar tu tiempo.
          </span>
        </p>
      </div>
    );
  }

  const totalDuration = getTotalDuration(logs);

  return (
    <div className="log-section">
      {/* Header */}
      <div className="log-header">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-300">Hoy</h2>
          <span className="log-count">{logs.length}</span>
        </div>
        <span className="text-sm font-mono text-neutral-400">
          Total: {formatDuration(totalDuration)}
        </span>
      </div>

      {/* Log Items */}
      <ul className="log-list">
        {logs.map((log, index) => (
          <li key={log.id} className="log-item" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="log-color-dot" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">
                  {log.taskName}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatTimeOfDay(log.startTime)} → {formatTimeOfDay(log.endTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="log-duration">{formatDuration(log.duration)}</span>
              <button
                onClick={() => onDeleteLog(log.id)}
                className="log-delete-btn"
                aria-label={`Eliminar registro ${log.taskName}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
