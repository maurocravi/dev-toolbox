export interface TimeLog {
  id: string;
  taskName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in seconds
}

// DB row shape (snake_case columns in Supabase)
export interface DbLog {
  id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  duration: number;
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

export function timeLogToDb(log: TimeLog): DbLog {
  return {
    id: log.id,
    task_name: log.taskName,
    start_time: log.startTime,
    end_time: log.endTime,
    duration: log.duration,
  };
}
