"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import TimerInput from "./components/TimerInput";
import LogList from "./components/LogList";
import type { TimeLog, DbLog } from "./types";
import { dbToTimeLog, timeLogToDb } from "./types";
import { createClient } from "@/lib/supabase/client";

const DAYS_PER_PAGE = 7;

function getDayKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function groupLogsByDay(allLogs: TimeLog[]): Map<string, TimeLog[]> {
  const groups = new Map<string, TimeLog[]>();
  for (const log of allLogs) {
    const dayKey = getDayKey(new Date(log.startTime));
    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }
    groups.get(dayKey)!.push(log);
  }
  for (const [, logs] of groups) {
    logs.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
  return groups;
}

export default function Home() {
  const [allLogs, setAllLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
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
    setAllLogs((prev) => [log, ...prev]);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("logs")
      .insert(timeLogToDb(log));

    if (insertError) {
      console.error("Error inserting log:", insertError);
      setAllLogs((prev) => prev.filter((l) => l.id !== log.id));
    }
  }, []);

  const handleDeleteLog = useCallback(async (id: string) => {
    setAllLogs((prev) => prev.filter((log) => log.id !== id));

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("logs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting log:", deleteError);
      const { data } = await supabase
        .from("logs")
        .select("*")
        .order("start_time", { ascending: false });
      if (data) setAllLogs((data as DbLog[]).map(dbToTimeLog));
    }
  }, []);

  const handleUpdateLog = useCallback(async (updatedLog: TimeLog) => {
    setAllLogs((prev) =>
      prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("logs")
      .update(timeLogToDb(updatedLog))
      .eq("id", updatedLog.id);

    if (updateError) {
      console.error("Error updating log:", updateError);
      const { data } = await supabase
        .from("logs")
        .select("*")
        .order("start_time", { ascending: false });
      if (data) setAllLogs((data as DbLog[]).map(dbToTimeLog));
    }
  }, []);

  const groupedLogs = useMemo(() => groupLogsByDay(allLogs), [allLogs]);

  const uniqueDays = useMemo(() => {
    return Array.from(groupedLogs.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedLogs]);

  const visibleDaysList = useMemo(() => {
    return uniqueDays.slice(0, visibleDays);
  }, [uniqueDays, visibleDays]);

  const hasMoreDays = uniqueDays.length > visibleDays;

  const handleLoadMore = () => {
    setVisibleDays((prev) => prev + DAYS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-8 px-4" style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
      }}>
        <div className="w-full max-w-[640px]">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-100">QA Toolbox</h1>
                <p className="text-xs text-neutral-500">Navaja suiza para QA</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-7 h-7 border-[3px] border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 mt-3">Cargando registros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center py-8 px-4" style={{
      background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
    }}>
      <div className="w-full max-w-[640px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">QA Toolbox</h1>
              <p className="text-xs text-neutral-500">Navaja suiza para QA</p>
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
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-[var(--danger-hover)]">
            <span>{error}</span>
          </div>
        )}

        {/* Timer */}
        <TimerInput onLogCreated={handleLogCreated} />

        {/* Logs */}
        <LogList
          visibleDays={visibleDaysList}
          groupedLogs={groupedLogs}
          onDeleteLog={handleDeleteLog}
          onUpdateLog={handleUpdateLog}
          hasMore={hasMoreDays}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
