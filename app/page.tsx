"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TimerInput from "./components/TimerInput";
import LogList from "./components/LogList";
import PageHeader from "./components/PageHeader";
import ErrorBanner from "./components/ErrorBanner";
import { useConfirm } from "./components/ConfirmDialog";
import type { TimeLog, DbLog } from "./types";
import { dbToTimeLog, timeLogToDb } from "./types";
import { createClient } from "@/lib/supabase/client";
import { startOfDay, groupLogsByDay } from "@/lib/time";

const DAYS_PER_PAGE = 7;

interface LogsPage {
  logs: TimeLog[];
  oldestLoaded: string | null;
  hasMore: boolean;
}

// Fetches a window of DAYS_PER_PAGE calendar days anchored on the newest log
// older than `before`, so each page always contains at least one day with data.
async function fetchLogsPage(before: string | null): Promise<LogsPage> {
  const supabase = createClient();

  let anchorQuery = supabase
    .from("logs")
    .select("start_time")
    .order("start_time", { ascending: false })
    .limit(1);
  if (before) anchorQuery = anchorQuery.lt("start_time", before);
  const { data: anchorData, error: anchorError } = await anchorQuery;
  if (anchorError) throw anchorError;
  if (!anchorData || anchorData.length === 0) {
    return { logs: [], oldestLoaded: before, hasMore: false };
  }

  const windowStart = startOfDay(new Date(anchorData[0].start_time));
  windowStart.setDate(windowStart.getDate() - (DAYS_PER_PAGE - 1));
  const windowStartIso = windowStart.toISOString();

  let logsQuery = supabase
    .from("logs")
    .select("*")
    .gte("start_time", windowStartIso)
    .order("start_time", { ascending: false });
  if (before) logsQuery = logsQuery.lt("start_time", before);
  const { data, error } = await logsQuery;
  if (error) throw error;

  const { data: olderData, error: olderError } = await supabase
    .from("logs")
    .select("id")
    .lt("start_time", windowStartIso)
    .limit(1);
  if (olderError) throw olderError;

  return {
    logs: ((data ?? []) as DbLog[]).map(dbToTimeLog),
    oldestLoaded: windowStartIso,
    hasMore: (olderData?.length ?? 0) > 0,
  };
}

export default function Home() {
  const confirm = useConfirm();
  const [allLogs, setAllLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const oldestLoadedRef = useRef<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shows a transient error (for failed mutations); the initial-load error stays persistent
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 6000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const page = await fetchLogsPage(null);
        setAllLogs(page.logs);
        oldestLoadedRef.current = page.oldestLoaded;
        setHasMore(page.hasMore);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Error al cargar los registros.");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  // Re-fetches only the already-loaded window, used to recover from failed mutations
  const refetchLoaded = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("logs")
      .select("*")
      .order("start_time", { ascending: false });
    if (oldestLoadedRef.current) {
      query = query.gte("start_time", oldestLoadedRef.current);
    }
    const { data } = await query;
    if (data) setAllLogs((data as DbLog[]).map(dbToTimeLog));
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
      showError("No se pudo guardar el registro. Probá de nuevo.");
    }
  }, [showError]);

  const handleDeleteLog = useCallback(async (id: string) => {
    const ok = await confirm({
      title: "Eliminar registro",
      message: "¿Seguro que querés eliminar este registro de tiempo? Esta acción no se puede deshacer.",
      variant: "danger",
    });
    if (!ok) return;

    setAllLogs((prev) => prev.filter((log) => log.id !== id));

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("logs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting log:", deleteError);
      showError("No se pudo eliminar el registro.");
      await refetchLoaded();
    }
  }, [refetchLoaded, showError, confirm]);

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
      showError("No se pudieron guardar los cambios del registro.");
      await refetchLoaded();
    }
  }, [refetchLoaded, showError]);

  const handleToggleJira = useCallback(async (logId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setAllLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, isLoggedJira: newStatus } : log))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("logs")
      .update({ is_logged_jira: newStatus })
      .eq("id", logId);

    if (updateError) {
      console.error("Error actualizando estado Jira:", updateError);
      showError("No se pudo actualizar el estado de Jira.");
      await refetchLoaded();
    }
  }, [refetchLoaded, showError]);

  const groupedLogs = useMemo(() => groupLogsByDay(allLogs), [allLogs]);

  const uniqueDays = useMemo(() => {
    return Array.from(groupedLogs.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedLogs]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !oldestLoadedRef.current) return;
    setLoadingMore(true);
    try {
      const page = await fetchLogsPage(oldestLoadedRef.current);
      setAllLogs((prev) => {
        const knownIds = new Set(prev.map((log) => log.id));
        return [...prev, ...page.logs.filter((log) => !knownIds.has(log.id))];
      });
      oldestLoadedRef.current = page.oldestLoaded;
      setHasMore(page.hasMore);
    } catch (err) {
      console.error("Error cargando más registros:", err);
      showError("No se pudieron cargar más registros.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, showError]);

  return (
    <div className="min-h-screen flex justify-center py-8 px-4" style={{
      background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
    }}>
      <div className="w-full max-w-[640px]">
        <PageHeader
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          }
          title="QA Toolbox"
          subtitle="Navaja suiza para QA"
          right={
            <div className="text-xs text-neutral-600 font-mono">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          }
        />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-7 h-7 border-[3px] border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 mt-3">Cargando registros...</p>
          </div>
        ) : (
          <>
            {/* Timer */}
            <TimerInput onLogCreated={handleLogCreated} />

            {/* Logs */}
            <LogList
              visibleDays={uniqueDays}
              groupedLogs={groupedLogs}
              onDeleteLog={handleDeleteLog}
              onUpdateLog={handleUpdateLog}
              onToggleJira={handleToggleJira}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
            />
          </>
        )}
      </div>
    </div>
  );
}
