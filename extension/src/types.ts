export interface TimeLog {
  id: string;
  taskName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in seconds
}

export interface DbLog {
  id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  user_id?: string;
}

export interface TimerState {
  isRunning: boolean;
  logId: string | null;
  taskName: string;
  startTime: string | null; // ISO string
}

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
  };
}

export function dbToTimeLog(row: DbLog): TimeLog {
  return {
    id: row.id,
    taskName: row.task_name,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
  };
}

export function timeLogToDb(log: TimeLog): Omit<DbLog, "user_id"> {
  return {
    id: log.id,
    task_name: log.taskName,
    start_time: log.startTime,
    end_time: log.endTime,
    duration: log.duration,
  };
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
