"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { TimeLog } from "../types";
import { generateUUID, timeLogToDb } from "../types";
import { createClient } from "@/lib/supabase/client";
import { isForgottenTimer, FORGOTTEN_SNOOZE_SECS } from "@/lib/time";

// El estado del timer vive acá (montado en AppShell) en vez de en la página del
// Time Tracker, para que siga corriendo al navegar a Proyectos/Notas. Además se
// persiste en localStorage para sobrevivir recargas y cierres de pestaña.

const STORAGE_KEY = "qb_web_timer";
const DEFAULT_TASK_NAME = "Tarea sin nombre";

interface StoredTimer {
  taskName: string;
  startTime: string | null; // ISO; null = no está corriendo
  snoozedUntil: string | null; // ISO; hasta cuándo no avisar de timer olvidado
  projectId: string | null; // proyecto al que se carga el tiempo
}

interface TimerContextValue {
  taskName: string;
  setTaskName: (name: string) => void;
  projectId: string | null;
  /** Se puede cambiar también mientras corre: se aplica al guardar. */
  setProjectId: (id: string | null) => void;
  startTime: string | null;
  isRunning: boolean;
  saving: boolean;
  error: string | null;
  clearError: () => void;
  start: () => void;
  /**
   * Detiene y guarda. Con `endAt` se recorta el registro a esa hora (timer olvidado).
   * Devuelve true si se guardó (o no había nada corriendo).
   */
  stop: (endAt?: Date) => Promise<boolean>;
  snoozedUntil: string | null;
  /** Pospone el aviso de timer olvidado. */
  snooze: () => void;
  /** Arranca el timer con el nombre de una tarea anterior; si ya hay uno corriendo, lo guarda primero. */
  resume: (taskName: string, projectId: string | null) => Promise<void>;
  /** Registra un callback que recibe cada log guardado al detener. Devuelve la función para desuscribirse. */
  subscribeLogCreated: (fn: (log: TimeLog) => void) => () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer debe usarse dentro de <TimerProvider>");
  return ctx;
}

/** Segundos transcurridos desde `startTime`, recalculado cada segundo. */
export function useElapsed(startTime: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startTime) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // refresco inmediato al iniciar/retomar
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [startTime]);

  if (!startTime) return 0;
  return Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
}

/** true si el timer lleva demasiado tiempo corriendo y el aviso no está pospuesto. */
export function useForgottenTimer(): boolean {
  const { startTime, snoozedUntil } = useTimer();
  const elapsed = useElapsed(startTime);
  if (!startTime) return false;
  const nowMs = new Date(startTime).getTime() + elapsed * 1000;
  return isForgottenTimer(startTime, nowMs, snoozedUntil);
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Store en localStorage, leído con useSyncExternalStore ───
// Así el estado sobrevive recargas, no hay mismatch de hidratación (en el server
// se usa EMPTY) y las otras pestañas se enteran vía el evento "storage".

const EMPTY: StoredTimer = { taskName: "", startTime: null, snoozedUntil: null, projectId: null };
let memoryValue: StoredTimer = EMPTY; // fallback si localStorage no está disponible
let cache: { raw: string | null; value: StoredTimer } = { raw: null, value: EMPTY };
const storeListeners = new Set<() => void>();

function parseStored(raw: string): StoredTimer {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredTimer>;
    const startTime =
      typeof parsed.startTime === "string" && !isNaN(new Date(parsed.startTime).getTime())
        ? parsed.startTime
        : null;
    const snoozedUntil =
      typeof parsed.snoozedUntil === "string" && !isNaN(new Date(parsed.snoozedUntil).getTime())
        ? parsed.snoozedUntil
        : null;
    return {
      taskName: typeof parsed.taskName === "string" ? parsed.taskName : "",
      startTime,
      snoozedUntil,
      projectId: typeof parsed.projectId === "string" ? parsed.projectId : null,
    };
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): StoredTimer {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryValue;
  }
  // Devolver la misma referencia mientras el contenido no cambie (requisito de useSyncExternalStore)
  if (raw !== cache.raw) cache = { raw, value: raw ? parseStored(raw) : EMPTY };
  return cache.value;
}

function getServerSnapshot(): StoredTimer {
  return EMPTY;
}

function setStored(state: StoredTimer) {
  memoryValue = state;
  try {
    if (!state.startTime && !state.taskName && !state.projectId) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage no disponible (modo privado, etc.): el timer sigue funcionando en memoria
  }
  storeListeners.forEach((fn) => fn());
}

function subscribeStore(fn: () => void) {
  storeListeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    storeListeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { taskName, startTime, snoozedUntil, projectId } = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenersRef = useRef(new Set<(log: TimeLog) => void>());
  const savingRef = useRef(false);

  // Mostrar el tiempo en el título de la pestaña mientras corre
  useEffect(() => {
    if (!startTime) return;
    const originalTitle = document.title;
    const label = taskName.trim() || DEFAULT_TASK_NAME;
    const update = () => {
      const now = Date.now();
      const secs = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
      const icon = isForgottenTimer(startTime, now, snoozedUntil) ? "⚠️" : "▶";
      document.title = `${icon} ${formatTime(secs)} · ${label}`;
    };
    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
      document.title = originalTitle;
    };
  }, [startTime, taskName, snoozedUntil]);

  const setTaskName = useCallback((name: string) => {
    setStored({ ...getSnapshot(), taskName: name });
  }, []);

  const setProjectId = useCallback((id: string | null) => {
    setStored({ ...getSnapshot(), projectId: id });
  }, []);

  const start = useCallback(() => {
    const current = getSnapshot();
    if (current.startTime) return; // ya corre (p. ej. iniciado en otra pestaña)
    setError(null);
    setStored({ ...current, startTime: new Date().toISOString(), snoozedUntil: null });
  }, []);

  const stop = useCallback(async (endAt?: Date): Promise<boolean> => {
    if (!startTime) return true;
    if (savingRef.current) return false;
    savingRef.current = true;

    const endTime = endAt ?? new Date();
    const log: TimeLog = {
      id: generateUUID(),
      taskName: taskName.trim() || DEFAULT_TASK_NAME,
      startTime,
      endTime: endTime.toISOString(),
      duration: Math.max(0, Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000)),
      isLoggedJira: false,
      projectId,
    };

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("logs").insert(timeLogToDb(log));

    setSaving(false);
    savingRef.current = false;

    if (insertError) {
      // El timer sigue corriendo con el mismo inicio: no se pierde nada y se puede reintentar
      console.error("Error inserting log:", insertError);
      setError("No se pudo guardar el registro. El timer sigue corriendo; probá detenerlo de nuevo.");
      return false;
    }

    setStored(EMPTY);
    listenersRef.current.forEach((fn) => fn(log));
    return true;
  }, [startTime, taskName, projectId]);

  const resume = useCallback(
    async (name: string, logProjectId: string | null) => {
      // Si hay otra tarea corriendo, se guarda primero; si falla, no se pisa
      if (!(await stop())) return;
      setError(null);
      setStored({ taskName: name, startTime: new Date().toISOString(), snoozedUntil: null, projectId: logProjectId });
    },
    [stop]
  );

  const subscribeLogCreated = useCallback((fn: (log: TimeLog) => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const snooze = useCallback(() => {
    const current = getSnapshot();
    if (!current.startTime) return;
    setStored({ ...current, snoozedUntil: new Date(Date.now() + FORGOTTEN_SNOOZE_SECS * 1000).toISOString() });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Atajo global: Cmd+Enter (Mac) / Ctrl+Enter inicia o detiene el timer desde cualquier página
  const toggleRef = useRef<() => void>(() => {});
  useEffect(() => {
    toggleRef.current = () => {
      if (savingRef.current) return;
      if (startTime) stop();
      else start();
    };
  }, [startTime, start, stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey) || e.repeat || e.defaultPrevented) return;
      // No interferir con modales abiertos ni con otros campos de texto (salvo el de la tarea)
      if (document.querySelector('[role="dialog"], .fixed.inset-0')) return;
      const target = e.target as HTMLElement | null;
      const isOtherField =
        target &&
        target.id !== "task-name-input" &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (isOtherField) return;
      e.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        taskName,
        setTaskName,
        projectId,
        setProjectId,
        startTime,
        isRunning: startTime !== null,
        saving,
        error,
        clearError,
        start,
        stop,
        snoozedUntil,
        snooze,
        resume,
        subscribeLogCreated,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
