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

// ═══════════════════════════════════════════
// Project types
// ═══════════════════════════════════════════

export interface ProjectLink {
  label: string;
  url: string;
  color: "blue" | "red";
}

export interface ProjectAccount {
  name: string;
  username: string;
  password: string;
  color: "blue" | "red";
}

export interface DbProject {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  color: string;
  links: ProjectLink[];
  accounts: unknown[];
  user_id: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  links: ProjectLink[];
  accounts: ProjectAccount[];
}

export function dbToProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color || "#94a3b8",
    description: row.description || "",
    createdAt: row.created_at,
    links: Array.isArray(row.links) ? row.links : [],
    accounts: Array.isArray(row.accounts) ? (row.accounts as ProjectAccount[]) : [],
  };
}

export function projectToDb(project: Project): {
  name: string;
  description: string;
  color: string;
  links: ProjectLink[];
  accounts: ProjectAccount[];
  user_id: string | null;
} {
  return {
    name: project.name,
    description: project.description || "",
    color: project.color,
    links: project.links,
    accounts: project.accounts,
    user_id: null,
  };
}
