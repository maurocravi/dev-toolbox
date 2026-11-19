"use client";

import { useRef, useSyncExternalStore } from "react";
import { useProjectOptions } from "@/lib/projectOptions";
import { findProjectIdByTaskName } from "@/lib/jiraPrefix";
import { useTimer, useElapsed, formatTime } from "./TimerContext";
import ErrorBanner from "./ErrorBanner";
import ForgottenTimerNotice from "./ForgottenTimerNotice";
import ProjectPicker, { ProjectChip } from "./ProjectPicker";

const noopSubscribe = () => () => {};
/** "⌘" en Mac, "Ctrl" en el resto (en el server se asume "Ctrl" y se corrige al hidratar). */
function useModKeyLabel(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl"
  );
}

export default function TimerInput() {
  const { taskName, setTaskName, projectId, setProjectId, startTime, isRunning, saving, error, clearError, start, stop } =
    useTimer();
  const elapsed = useElapsed(startTime);
  const modKey = useModKeyLabel();
  const { projects } = useProjectOptions();
  // Proyecto que se eligió solo por el prefijo; si el usuario elige uno a mano, no se pisa
  const autoProjectRef = useRef<string | null>(null);

  const handleTaskNameChange = (name: string) => {
    setTaskName(name);
    const detected = findProjectIdByTaskName(name, projects);
    const isAutoOrEmpty = projectId === null || projectId === autoProjectRef.current;
    if (!isAutoOrEmpty) return;
    if (detected !== projectId) {
      setProjectId(detected);
    }
    autoProjectRef.current = detected;
  };

  const handleProjectChange = (id: string | null) => {
    autoProjectRef.current = null;
    setProjectId(id);
  };

  const handleToggle = () => {
    if (saving) return;
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-6 transition-[border-color] duration-200 hover:border-[#2a2a32]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Time Tracker
        </span>
      </div>

      {/* Proyecto + nombre de la tarea */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2">
        <div className="flex-shrink-0 max-w-full sm:max-w-[40%] [&>div>button]:h-full [&>div]:h-full">
          <ProjectPicker id="timer-project-picker" value={projectId} onChange={handleProjectChange} />
        </div>
      <input
        id="task-name-input"
        type="text"
        placeholder="¿En qué estás trabajando?"
        value={taskName}
        onChange={(e) => handleTaskNameChange(e.target.value)}
        disabled={isRunning}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter lo maneja el atajo global (inicia aunque no haya nombre)
          if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !isRunning && taskName.trim()) {
            start();
          }
        }}
        className="flex-1 min-w-[12rem] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
      />
      </div>

      {/* Timer Display + Button */}
      <div className="flex items-center justify-between mt-5">
        <div className="font-mono text-2xl font-semibold tracking-wider leading-none text-[#3a3a44]">
          <span className={isRunning ? "![color:var(--foreground)] [text-shadow:0_0_20px_rgba(99,102,241,0.3)]" : ""}>
            {formatTime(elapsed)}
          </span>
        </div>

        <button
          id="timer-toggle-btn"
          onClick={handleToggle}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer transition-all duration-200 font-[inherit] ${
            isRunning
              ? "bg-[rgba(239,68,68,0.15)] text-[var(--danger)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.25)] hover:text-[var(--danger-hover)]"
              : "bg-[var(--accent)] text-white shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px"
          }`}
          aria-label={isRunning ? "Detener timer" : "Iniciar timer"}
          aria-keyshortcuts="Meta+Enter Control+Enter"
          title={`${isRunning ? "Detener" : "Iniciar"} (${modKey} + Enter)`}
        >
          {isRunning ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3.5L14.5 9L5 14.5V3.5Z" fill="currentColor" />
            </svg>
          )}
          <span>{isRunning ? "Detener" : "Iniciar"}</span>
          <kbd
            className={`hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 font-sans text-[0.625rem] font-semibold leading-none ${
              isRunning ? "bg-[rgba(239,68,68,0.15)] text-[var(--danger)]/80" : "bg-white/15 text-white/80"
            }`}
          >
            {modKey} ↵
          </kbd>
        </button>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-[pulse_2s_ease-in-out_infinite] flex-shrink-0" />
          Registrando tiempo para{" "}
          <span className="font-semibold text-emerald-300 truncate">
            {taskName.trim() || "Tarea sin nombre"}
          </span>
          <ProjectChip projectId={projectId} className="flex-shrink-0" />
        </div>
      )}

      <ForgottenTimerNotice />

      {error && (
        <div className="mt-4 [&>div]:mb-0">
          <ErrorBanner message={error} onDismiss={clearError} />
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="mt-4 flex items-center gap-2 text-xs text-violet-400">
          <div className="w-3.5 h-3.5 border-2 border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span>Guardando registro...</span>
        </div>
      )}
    </div>
  );
}
