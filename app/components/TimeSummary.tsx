"use client";

import { useEffect, useMemo, useState } from "react";
import type { TimeLog } from "../types";
import { useTimer, useElapsed } from "./TimerContext";
import {
  formatDuration,
  formatDurationShort,
  getWeekDayTotals,
  getWeekDayIndex,
  getDayKey,
} from "@/lib/time";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Fecha actual, refrescada cada minuto (para que "hoy" cambie si la página queda abierta a medianoche). */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface TimeSummaryProps {
  logs: TimeLog[];
}

// Totales de hoy y de la semana (lunes a domingo). Incluye en vivo el timer en curso.
// Se calcula sobre los logs ya cargados: la primera página siempre cubre la semana actual.
export default function TimeSummary({ logs }: TimeSummaryProps) {
  const now = useNow();
  const { startTime, isRunning } = useTimer();
  const runningSecs = useElapsed(startTime);

  const { weekTotals, todayCount } = useMemo(() => {
    const todayKey = getDayKey(now);
    return {
      weekTotals: getWeekDayTotals(logs, now),
      todayCount: logs.filter((l) => getDayKey(new Date(l.startTime)) === todayKey).length,
    };
  }, [logs, now]);

  const todayIndex = getWeekDayIndex(now);

  // El timer en curso suma en el día en que empezó (igual que se agrupará al guardarse)
  const totals = [...weekTotals];
  if (startTime) {
    const runningTotals = getWeekDayTotals(
      [{ id: "running", taskName: "", startTime, endTime: startTime, duration: runningSecs, isLoggedJira: false, projectId: null }],
      now
    );
    runningTotals.forEach((secs, i) => (totals[i] += secs));
  }

  const todayTotal = totals[todayIndex];
  const weekTotal = totals.reduce((a, b) => a + b, 0);
  const daysWorked = totals.filter((t) => t > 0).length;
  const dailyAverage = daysWorked > 0 ? Math.round(weekTotal / daysWorked) : 0;
  const maxDay = Math.max(...totals, 1);

  return (
    <div className="@container mb-6">
      <div className="grid grid-cols-1 @[580px]:grid-cols-2 gap-3">
      {/* Hoy */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-4 flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Hoy</span>
        <span
          className="mt-2 font-mono text-2xl font-semibold tracking-wide whitespace-nowrap text-[var(--foreground)]"
          title={formatDuration(todayTotal)}
        >
          {formatDurationShort(todayTotal)}
        </span>
        <span className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          {todayCount} {todayCount === 1 ? "registro" : "registros"}
          {isRunning && (
            <>
              <span className="text-neutral-700">·</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="text-emerald-400">en curso</span>
            </>
          )}
        </span>
      </div>

      {/* Esta semana */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Esta semana</span>
            <span
              className="mt-2 font-mono text-2xl font-semibold tracking-wide whitespace-nowrap text-[var(--foreground)]"
              title={formatDuration(weekTotal)}
            >
              {formatDurationShort(weekTotal)}
            </span>
          </div>

          {/* Barras por día */}
          <div className="flex items-end gap-1.5 h-14 flex-shrink-0" aria-label="Tiempo por día de la semana">
            {totals.map((secs, i) => {
              const isToday = i === todayIndex;
              const isFuture = i > todayIndex;
              const heightPct = secs > 0 ? Math.max(8, (secs / maxDay) * 100) : 0;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 h-full justify-end"
                  title={`${DAY_NAMES[i]}: ${secs > 0 ? formatDuration(secs) : "sin registros"}`}
                >
                  <div className="relative w-2.5 flex-1 flex items-end rounded-sm bg-[rgba(255,255,255,0.03)]">
                    <div
                      className={`w-full rounded-sm transition-[height] duration-300 ${
                        isToday ? "bg-[var(--accent)] shadow-[0_0_8px_rgba(99,102,241,0.4)]" : "bg-[rgba(99,102,241,0.45)]"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[0.625rem] font-semibold leading-none ${
                      isToday ? "text-[var(--accent-hover)]" : isFuture ? "text-neutral-700" : "text-neutral-500"
                    }`}
                  >
                    {DAY_LETTERS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <span className="block pt-3 text-xs text-neutral-500">
          {daysWorked > 0
            ? `Promedio ${formatDurationShort(dailyAverage)} por día trabajado`
            : "Sin registros esta semana"}
        </span>
      </div>
      </div>
    </div>
  );
}
