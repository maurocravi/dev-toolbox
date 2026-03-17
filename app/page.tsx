"use client";

import { useState, useEffect, useCallback } from "react";
import TimerInput from "./components/TimerInput";
import LogList from "./components/LogList";
import type { TimeLog } from "./types";

const STORAGE_KEY = "dev-toolbox-time-logs";

function getTodayLogs(allLogs: TimeLog[]): TimeLog[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return allLogs
    .filter((log) => new Date(log.startTime) >= today)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
}

function loadLogs(): TimeLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: TimeLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export default function Home() {
  const [allLogs, setAllLogs] = useState<TimeLog[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setAllLogs(loadLogs());
    setMounted(true);
  }, []);

  const handleLogCreated = useCallback((log: TimeLog) => {
    setAllLogs((prev) => {
      const updated = [log, ...prev];
      saveLogs(updated);
      return updated;
    });
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    setAllLogs((prev) => {
      const updated = prev.filter((log) => log.id !== id);
      saveLogs(updated);
      return updated;
    });
  }, []);

  const todayLogs = getTodayLogs(allLogs);

  if (!mounted) {
    return (
      <main className="app-container">
        <div className="app-content">
          <div className="app-header">
            <div className="flex items-center gap-3">
              <div className="app-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-100">Dev Toolbox</h1>
                <p className="text-xs text-neutral-500">Navaja suiza para desarrolladores</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      <div className="app-content">
        {/* Header */}
        <div className="app-header">
          <div className="flex items-center gap-3">
            <div className="app-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">Dev Toolbox</h1>
              <p className="text-xs text-neutral-500">Navaja suiza para desarrolladores</p>
            </div>
          </div>
          <div className="text-xs text-neutral-600 font-mono">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>

        {/* Timer */}
        <TimerInput onLogCreated={handleLogCreated} />

        {/* Logs */}
        <LogList logs={todayLogs} onDeleteLog={handleDeleteLog} />
      </div>
    </main>
  );
}
