export interface TimeLog {
  id: string;
  taskName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in seconds
  isLoggedJira: boolean;
  projectId: string | null;
}

// UUID v4 generator that works in all browser contexts (no crypto.randomUUID dependency)
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// DB row shape (snake_case columns in Supabase)
export interface DbLog {
  id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  is_logged_jira: boolean;
  project_id: string | null;
}

export function dbToTimeLog(row: DbLog): TimeLog {
  return {
    id: row.id,
    taskName: row.task_name,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    isLoggedJira: row.is_logged_jira ?? false,
    projectId: row.project_id ?? null,
  };
}

export function timeLogToDb(log: TimeLog): DbLog {
  return {
    id: log.id,
    task_name: log.taskName,
    start_time: log.startTime,
    end_time: log.endTime,
    duration: log.duration,
    is_logged_jira: log.isLoggedJira,
    project_id: log.projectId,
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

// A folder groups its own set of links and accounts inside a project (one level deep)
export interface ProjectFolder {
  id: string;
  name: string;
  color: string;
  links: ProjectLink[];
  accounts: ProjectAccount[];
}

export interface DbProject {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  color: string;
  links: ProjectLink[];
  accounts: unknown[];
  folders: unknown[];
  jira_prefixes: string[] | null;
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
  folders: ProjectFolder[];
  /** Prefijos de claves Jira (ej. ["SK"]) para asociar tareas al proyecto automáticamente. */
  jiraPrefixes: string[];
}

function normalizeFolder(raw: unknown): ProjectFolder {
  const f = (raw ?? {}) as Partial<ProjectFolder>;
  return {
    id: typeof f.id === "string" ? f.id : generateUUID(),
    name: typeof f.name === "string" ? f.name : "",
    color: typeof f.color === "string" ? f.color : "#94a3b8",
    links: Array.isArray(f.links) ? f.links : [],
    accounts: Array.isArray(f.accounts) ? f.accounts : [],
  };
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
    folders: Array.isArray(row.folders) ? row.folders.map(normalizeFolder) : [],
    jiraPrefixes: Array.isArray(row.jira_prefixes) ? row.jira_prefixes : [],
  };
}

export function projectToDb(project: Project): {
  name: string;
  description: string;
  color: string;
  links: ProjectLink[];
  accounts: ProjectAccount[];
  folders: ProjectFolder[];
  jira_prefixes: string[];
  user_id: string | null;
} {
  return {
    name: project.name,
    description: project.description || "",
    color: project.color,
    links: project.links,
    accounts: project.accounts,
    folders: project.folders,
    jira_prefixes: project.jiraPrefixes,
    user_id: null,
  };
}

// ═══════════════════════════════════════════
// Note types
// ═══════════════════════════════════════════

export interface DbNote {
  id: string;
  created_at: string;
  title: string;
  content: string;
  color: string | null;
  user_id: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
}

export function dbToNote(row: DbNote): Note {
  return {
    id: row.id,
    title: row.title || "",
    content: row.content || "",
    color: row.color || "#94a3b8",
    createdAt: row.created_at,
  };
}

export function noteToDb(note: Note): {
  title: string;
  content: string;
  color: string;
  user_id: string | null;
} {
  return {
    title: note.title,
    content: note.content,
    color: note.color,
    user_id: null,
  };
}
