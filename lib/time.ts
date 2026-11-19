import type { TimeLog } from "../app/types";

// ═══════════════════════════════════════════
// Días y agrupación de logs
// ═══════════════════════════════════════════

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Day keys are the ISO string of local midnight, so grouping follows the user's timezone
export function getDayKey(date: Date): string {
  return startOfDay(date).toISOString();
}

export function groupLogsByDay(allLogs: TimeLog[]): Map<string, TimeLog[]> {
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

export function getDayLabel(dayKey: string, now: Date = new Date()): string {
  const today = startOfDay(now);
  const dayDate = startOfDay(new Date(dayKey));
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

// ═══════════════════════════════════════════
// Duraciones
// ═══════════════════════════════════════════

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDurationEditable(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function parseDurationInput(input: string): number | null {
  const parts = input.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [h, m, s] = parts;
  if (h < 0 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}

export function getTotalDuration(logs: TimeLog[]): number {
  return logs.reduce((acc, log) => acc + log.duration, 0);
}

// ═══════════════════════════════════════════
// Semana (lunes a domingo, hora local)
// ═══════════════════════════════════════════

/** Lunes 00:00 local de la semana que contiene `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const daysSinceMonday = (d.getDay() + 6) % 7; // getDay: 0 = domingo
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

/**
 * Segundos registrados por día en la semana de `now`: índice 0 = lunes … 6 = domingo.
 * Igual que la lista, cada log cuenta en el día local en que empezó.
 */
export function getWeekDayTotals(logs: TimeLog[], now: Date = new Date()): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  for (const log of logs) {
    const start = new Date(log.startTime);
    if (start < weekStart || start >= weekEnd) continue;
    totals[(start.getDay() + 6) % 7] += log.duration;
  }
  return totals;
}

/** Índice del día de `now` dentro de la semana (0 = lunes … 6 = domingo). */
export function getWeekDayIndex(now: Date = new Date()): number {
  return (now.getDay() + 6) % 7;
}

/** Duración compacta para totales: "3h 05m", "45m", "30s". */
export function formatDurationShort(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  return `${totalSeconds}s`;
}

// ═══════════════════════════════════════════
// Horas y fechas para inputs
// ═══════════════════════════════════════════

export function formatTimeOfDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════
// Timers olvidados
// ═══════════════════════════════════════════

/** A partir de cuántos segundos corriendo se considera que el timer pudo quedar olvidado. */
export const FORGOTTEN_TIMER_SECS = 4 * 3600;
/** Cuánto se pospone el aviso al elegir "Sigo trabajando". */
export const FORGOTTEN_SNOOZE_SECS = 2 * 3600;

export function isForgottenTimer(
  startIso: string | null,
  nowMs: number,
  snoozedUntilIso: string | null
): boolean {
  if (!startIso) return false;
  const elapsedSecs = (nowMs - new Date(startIso).getTime()) / 1000;
  if (elapsedSecs < FORGOTTEN_TIMER_SECS) return false;
  if (snoozedUntilIso && nowMs < new Date(snoozedUntilIso).getTime()) return false;
  return true;
}

/** "YYYY-MM-DDTHH:MM" en hora local, para un <input type="datetime-local">. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Valida la hora de fin elegida al recortar un timer. Devuelve un mensaje de error,
 * o null si es válida (posterior al inicio y no en el futuro).
 */
export function validateTrimEnd(startIso: string, end: Date | null, now: Date): string | null {
  if (!end || isNaN(end.getTime())) return "Elegí una fecha y hora válidas.";
  if (end.getTime() <= new Date(startIso).getTime()) return "La hora de fin tiene que ser posterior al inicio.";
  if (end.getTime() > now.getTime()) return "La hora de fin no puede estar en el futuro.";
  return null;
}

// Extract YYYY-MM-DD from an ISO string for a date input
export function toDateInputValue(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Combine a new date (YYYY-MM-DD) with the time from an original ISO string
export function combineDateWithTime(newDateValue: string, originalIso: string): string | null {
  if (!newDateValue) return null;
  const original = new Date(originalIso);
  const [year, month, day] = newDateValue.split("-").map(Number);
  const combined = new Date(year, month - 1, day, original.getHours(), original.getMinutes(), original.getSeconds(), original.getMilliseconds());
  if (isNaN(combined.getTime())) return null;
  return combined.toISOString();
}
