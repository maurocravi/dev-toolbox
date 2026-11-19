"use client";

import { useState } from "react";
import { useTimer, useForgottenTimer } from "./TimerContext";
import {
  FORGOTTEN_TIMER_SECS,
  FORGOTTEN_SNOOZE_SECS,
  toDateTimeLocalValue,
  validateTrimEnd,
  formatTimeOfDay,
} from "@/lib/time";

const thresholdHours = FORGOTTEN_TIMER_SECS / 3600;
const snoozeHours = FORGOTTEN_SNOOZE_SECS / 3600;

// Aviso cuando el timer lleva demasiado tiempo corriendo: permite seguir
// (pospone el aviso) o recortar el registro a la hora real en que terminaste.
export default function ForgottenTimerNotice() {
  const { startTime, saving, stop, snooze } = useTimer();
  const forgotten = useForgottenTimer();
  const [trimming, setTrimming] = useState(false);
  const [endValue, setEndValue] = useState("");
  const [trimError, setTrimError] = useState<string | null>(null);

  if (!forgotten || !startTime) return null;

  const openTrim = () => {
    setEndValue(toDateTimeLocalValue(new Date()));
    setTrimError(null);
    setTrimming(true);
  };

  const saveTrim = async () => {
    const end = endValue ? new Date(endValue) : null;
    const validationError = validateTrimEnd(startTime, end, new Date());
    if (validationError) {
      setTrimError(validationError);
      return;
    }
    const ok = await stop(end!);
    if (ok) setTrimming(false);
  };

  return (
    <div className="mt-4 rounded-xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.07)] px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <svg className="mt-0.5 flex-shrink-0 text-amber-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold text-amber-300">
            Este timer lleva más de {thresholdHours} horas corriendo
          </p>
          <p className="mt-0.5 text-xs text-amber-200/70">
            Inicio: {formatTimeOfDay(startTime)} · ¿Te olvidaste de detenerlo?
          </p>

          {!trimming ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={openTrim}
                disabled={saving}
                className="rounded-lg bg-[rgba(245,158,11,0.18)] px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors duration-150 hover:bg-[rgba(245,158,11,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Recortar y detener
              </button>
              <button
                onClick={snooze}
                disabled={saving}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)] hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Vuelvo a avisarte en ${snoozeHours} horas`}
              >
                Sigo trabajando
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <label htmlFor="trim-end-input" className="block text-xs text-neutral-400 mb-1.5">
                ¿A qué hora terminaste?
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="trim-end-input"
                  type="datetime-local"
                  value={endValue}
                  min={toDateTimeLocalValue(new Date(startTime))}
                  max={toDateTimeLocalValue(new Date())}
                  onChange={(e) => {
                    setEndValue(e.target.value);
                    setTrimError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTrim();
                    if (e.key === "Escape") setTrimming(false);
                  }}
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-1.5 text-[0.8125rem] text-[var(--foreground)] outline-none [color-scheme:dark] focus:border-amber-400"
                />
                <button
                  onClick={saveTrim}
                  disabled={saving}
                  className="rounded-lg bg-[rgba(245,158,11,0.18)] px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors duration-150 hover:bg-[rgba(245,158,11,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setTrimming(false)}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)] hover:text-neutral-200"
                >
                  Cancelar
                </button>
              </div>
              {trimError && <p className="mt-1.5 text-xs text-[var(--danger-hover)]">{trimError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
