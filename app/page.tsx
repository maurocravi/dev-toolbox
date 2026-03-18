"use client";

import { useState, useEffect, useCallback } from "react";
import TimerInput from "./components/TimerInput";
import LogList from "./components/LogList";
import type { TimeLog, DbLog } from "./types";
import { dbToTimeLog, timeLogToDb } from "./types";
import { getSupabase } from "../lib/supabase";

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

export default function Home() {
  const [allLogs, setAllLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs from Supabase on mount
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await getSupabase()
          .from("logs")
          .select("*")
          .order("start_time", { ascending: false });

        if (fetchError) {
          console.error("Error fetching logs:", fetchError);
          setError("Error al cargar los registros.");
          setLoading(false);
          return;
        }

        const logs = (data as DbLog[]).map(dbToTimeLog);
        setAllLogs(logs);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching logs:", err);
        setError("Error al conectar con el servidor.");
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const handleLogCreated = useCallback(async (log: TimeLog) => {
    // Optimistic update
    setAllLogs((prev) => [log, ...prev]);

    const { error: insertError } = await getSupabase()
      .from("logs")
      .insert(timeLogToDb(log));

    if (insertError) {
      console.error("Error inserting log:", insertError);
      // Rollback optimistic update
      setAllLogs((prev) => prev.filter((l) => l.id !== log.id));
    }
  }, []);

  const handleDeleteLog = useCallback(async (id: string) => {
    // Optimistic update
    setAllLogs((prev) => {
      return prev.filter((log) => log.id !== id);
    });

    const { error: deleteError } = await getSupabase()
      .from("logs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting log:", deleteError);
      // Refetch to restore state
      const { data } = await getSupabase()
        .from("logs")
        .select("*")
        .order("start_time", { ascending: false });
      if (data) setAllLogs((data as DbLog[]).map(dbToTimeLog));
    }
  }, []);

  const handleUpdateLog = useCallback(async (updatedLog: TimeLog) => {
    // Optimistic update
    setAllLogs((prev) =>
      prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    );

    const { error: updateError } = await getSupabase()
      .from("logs")
      .update(timeLogToDb(updatedLog))
      .eq("id", updatedLog.id);

    if (updateError) {
      console.error("Error updating log:", updateError);
      // Refetch to restore state
      const { data } = await getSupabase()
        .from("logs")
        .select("*")
        .order("start_time", { ascending: false });
      if (data) setAllLogs((data as DbLog[]).map(dbToTimeLog));
    }
  }, []);

  const todayLogs = getTodayLogs(allLogs);

  // Loading state
  if (loading) {
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
          <div className="loading-container">
            <div className="saving-spinner loading-spinner-lg" />
            <p className="text-sm text-neutral-500 mt-3">Cargando registros...</p>
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

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* Timer */}
        <TimerInput onLogCreated={handleLogCreated} />

        {/* Logs */}
        <LogList logs={todayLogs} onDeleteLog={handleDeleteLog} onUpdateLog={handleUpdateLog} />
      </div>
    </main>
  );
}
