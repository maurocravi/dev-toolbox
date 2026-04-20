import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TimeLog } from "./types";

const SUPABASE_URL = "https://gzanznixyzbejrtbsuoh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6YW56bml4eXpiZWpydGJzdW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODQ1NDgsImV4cCI6MjA4OTM2MDU0OH0.-vMmKtFxHMVbxK8Ic9H6tRY0ZO9d9vFaRbB92ReuEN8";

const AUTH_STORAGE_KEY = "sb-auth-token";

// Adapter to persist Supabase auth session in chrome.storage.local
const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    const value = result[key];
    return value ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: AUTH_STORAGE_KEY,
        storage: chromeStorageAdapter,
      },
    });
  }
  return _client;
}

export async function signIn(email: string, password: string): Promise<{ id: string; email: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("No user returned");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}

// ─── Logs API ───

export async function createLog(taskName: string): Promise<TimeLog> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const logData = {
    task_name: taskName.trim() || "Tarea sin nombre",
    start_time: now,
    end_time: now,
    duration: 0,
  };

  const { data, error } = await supabase
    .from("logs")
    .insert(logData)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    taskName: data.task_name,
    startTime: data.start_time,
    endTime: data.end_time,
    duration: data.duration,
  };
}

export async function updateLog(logId: string, updates: Partial<TimeLog>): Promise<void> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.taskName !== undefined) dbUpdates.task_name = updates.taskName;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;

  const { error } = await supabase.from("logs").update(dbUpdates).eq("id", logId);
  if (error) throw error;
}

export async function finishLog(logId: string, startTimeIso: string): Promise<TimeLog> {
  const endTime = new Date();
  const startTime = new Date(startTimeIso);
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  await updateLog(logId, {
    endTime: endTime.toISOString(),
    duration,
  });

  return {
    id: logId,
    taskName: "",
    startTime: startTimeIso,
    endTime: endTime.toISOString(),
    duration,
  };
}

export async function fetchRecentLogs(limit = 15): Promise<TimeLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    taskName: row.task_name as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    duration: row.duration as number,
  }));
}

export async function deleteLog(logId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("logs").delete().eq("id", logId);
  if (error) throw error;
}
