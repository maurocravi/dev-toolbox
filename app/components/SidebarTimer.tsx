"use client";

import Link from "next/link";
import { useTimer, useElapsed, useForgottenTimer, formatTime } from "./TimerContext";
import { ProjectChip } from "./ProjectPicker";

// Mini indicador del timer en la sidebar: visible en todas las páginas mientras corre.
export default function SidebarTimer() {
  const { taskName, projectId, startTime, isRunning, saving, error, stop } = useTimer();
  const elapsed = useElapsed(startTime);
  const forgotten = useForgottenTimer();

  if (!isRunning) return null;

  return (
    <div
      className={`mx-4 mb-4 rounded-xl border p-3 ${
        forgotten
          ? "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.07)]"
          : "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.06)]"
      }`}
    >
      <Link href="/" className="block no-underline group" title="Ir al Time Tracker">
        <div className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-[pulse_2s_ease-in-out_infinite] flex-shrink-0" />
          En curso
        </div>
        <div className="mt-1.5 truncate text-[0.8125rem] text-[var(--foreground)] group-hover:text-emerald-300">
          {taskName.trim() || "Tarea sin nombre"}
        </div>
        {projectId && (
          <div className="mt-1 flex">
            <ProjectChip projectId={projectId} />
          </div>
        )}
        <div className="mt-1 font-mono text-lg font-semibold tracking-wider text-[var(--foreground)]">
          {formatTime(elapsed)}
        </div>
      </Link>

      {forgotten && (
        <Link
          href="/"
          className="mt-2 block text-[0.6875rem] leading-snug text-amber-300 no-underline hover:text-amber-200"
        >
          ⚠️ Lleva muchas horas. ¿Te olvidaste? Revisalo →
        </Link>
      )}

      {error && <p className="mt-2 text-[0.6875rem] leading-snug text-[var(--danger-hover)]">No se pudo guardar. Reintentá.</p>}

      <button
        onClick={() => stop()}
        disabled={saving}
        className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.15)] px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--danger)] transition-all duration-200 hover:bg-[rgba(239,68,68,0.25)] hover:text-[var(--danger-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        )}
        {saving ? "Guardando..." : "Detener"}
      </button>
    </div>
  );
}
