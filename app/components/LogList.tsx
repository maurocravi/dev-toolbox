"use client";

import { useState } from "react";
import type { TimeLog } from "../types";

interface LogListProps {
  visibleDays: string[];
  groupedLogs: Map<string, TimeLog[]>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateLog: (updatedLog: TimeLog) => Promise<void>;
  hasMore: boolean;
  onLoadMore: () => void;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDurationEditable(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function parseDurationInput(input: string): number | null {
  const parts = input.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [h, m, s] = parts;
  if (h < 0 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 3600 + m * 60 + s;
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

function getDayLabel(dayKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDate = new Date(dayKey);
  dayDate.setHours(0, 0, 0, 0);
  const diffMs = dayDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === -1) return "Ayer";
  return dayDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function LogList({
  visibleDays,
  groupedLogs,
  onDeleteLog,
  onUpdateLog,
  hasMore,
  onLoadMore,
}: LogListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEditing = (log: TimeLog) => {
    setEditingId(log.id);
    setEditTaskName(log.taskName);
    setEditDuration(formatDurationEditable(log.duration));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTaskName("");
    setEditDuration("");
  };

  const saveEdit = async (log: TimeLog) => {
    const newDuration = parseDurationInput(editDuration);
    if (newDuration === null || newDuration <= 0) return;

    const trimmedName = editTaskName.trim();
    if (!trimmedName) return;

    setSavingId(log.id);

    const newEndTime = new Date(
      new Date(log.startTime).getTime() + newDuration * 1000
    ).toISOString();

    const updatedLog: TimeLog = {
      ...log,
      taskName: trimmedName,
      duration: newDuration,
      endTime: newEndTime,
    };

    await onUpdateLog(updatedLog);
    setSavingId(null);
    setEditingId(null);
    setEditTaskName("");
    setEditDuration("");
  };

  if (visibleDays.length === 0) {
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
          No hay registros aún.
          <br />
          <span className="text-neutral-600">
            Inicia el timer para empezar a registrar tu tiempo.
          </span>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {visibleDays.map((dayKey) => {
          const logs = groupedLogs.get(dayKey) || [];
          if (logs.length === 0) return null;

          const totalDuration = getTotalDuration(logs);

          return (
            <div key={dayKey} className="log-section">
              {/* Day Header */}
              <div className="log-header">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-neutral-300">
                    {getDayLabel(dayKey)}
                  </h2>
                  <span className="log-count">{logs.length}</span>
                </div>
                <span className="text-sm font-mono text-neutral-400">
                  Total: {formatDuration(totalDuration)}
                </span>
              </div>

              {/* Log Items */}
              <ul className="log-list">
                {logs.map((log, index) => {
                  const isEditing = editingId === log.id;
                  const isSaving = savingId === log.id;

                  return (
                    <li
                      key={log.id}
                      className={`log-item ${isEditing ? "log-item-editing" : ""}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Saving overlay */}
                      {isSaving && (
                        <div className="log-saving-overlay">
                          <div className="saving-spinner" />
                          <span>Guardando...</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="log-color-dot" />
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTaskName}
                              onChange={(e) => setEditTaskName(e.target.value)}
                              className="log-edit-input"
                              placeholder="Nombre de tarea"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(log);
                                if (e.key === "Escape") cancelEditing();
                              }}
                            />
                          ) : (
                            <>
                              <p className="text-sm font-medium text-neutral-200 truncate">
                                {log.taskName}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {formatTimeOfDay(log.startTime)} →{" "}
                                {formatTimeOfDay(log.endTime)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              className="log-edit-input log-edit-duration"
                              placeholder="HH:MM:SS"
                              maxLength={8}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(log);
                                if (e.key === "Escape") cancelEditing();
                              }}
                            />
                            <button
                              onClick={() => saveEdit(log)}
                              className="log-action-btn log-save-btn"
                              aria-label="Guardar cambios"
                              disabled={isSaving}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="log-action-btn log-cancel-btn"
                              aria-label="Cancelar edición"
                              disabled={isSaving}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="log-duration">{formatDuration(log.duration)}</span>
                            <button
                              onClick={() => startEditing(log)}
                              className="log-action-btn log-edit-btn"
                              aria-label={`Editar registro ${log.taskName}`}
                              disabled={savingId !== null}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="log-delete-btn"
                              aria-label={`Eliminar registro ${log.taskName}`}
                              disabled={savingId !== null}
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
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            className="px-5 py-2.5 text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700"
          >
            Cargar más
          </button>
        </div>
      )}
    </>
  );
}
