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
// Horas y fechas para inputs
// ═══════════════════════════════════════════

export function formatTimeOfDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
