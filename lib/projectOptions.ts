"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

// Lista liviana de proyectos (id, nombre, color, prefijos Jira) para selectores y chips del Time Tracker.
// Solo pide esas columnas: nunca trae links ni credenciales. Se comparte entre todos los
// componentes y se refresca al volver a la pestaña (por si se editaron proyectos).

export interface ProjectOption {
  id: string;
  name: string;
  color: string;
  prefixes: string[];
}

const STALE_MS = 30_000;

let options: ProjectOption[] = [];
let loaded = false;
let lastFetch = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function refreshProjectOptions(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && loaded && Date.now() - lastFetch < STALE_MS) return Promise.resolve();

  inFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").select("id, name, color, jira_prefixes").order("name");
      if (error) throw error;
      options = (data ?? []).map((p) => ({
        id: p.id as string,
        name: (p.name as string) || "Sin nombre",
        color: (p.color as string) || "#94a3b8",
        prefixes: Array.isArray(p.jira_prefixes) ? (p.jira_prefixes as string[]) : [],
      }));
      loaded = true;
      lastFetch = Date.now();
      emit();
    } catch (err) {
      console.error("Error cargando proyectos:", err);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Marca la lista como desactualizada: el próximo componente que la use la vuelve a pedir. */
export function invalidateProjectOptions() {
  lastFetch = 0;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const EMPTY: ProjectOption[] = [];

export function useProjectOptions(): { projects: ProjectOption[]; loaded: boolean } {
  const projects = useSyncExternalStore(subscribe, () => options, () => EMPTY);
  const isLoaded = useSyncExternalStore(subscribe, () => loaded, () => false);

  useEffect(() => {
    refreshProjectOptions();
    const onFocus = () => refreshProjectOptions();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return { projects, loaded: isLoaded };
}
