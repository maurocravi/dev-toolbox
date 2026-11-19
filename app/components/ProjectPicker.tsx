"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProjectOptions, type ProjectOption } from "@/lib/projectOptions";

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  disabled?: boolean;
  size?: "md" | "sm";
  id?: string;
}

/** Punto + nombre del proyecto. Muestra nada si no hay proyecto o no se encuentra. */
export function ProjectChip({ projectId, className = "" }: { projectId: string | null; className?: string }) {
  const { projects } = useProjectOptions();
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;
  if (!project) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 max-w-full rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none ${className}`}
      style={{ backgroundColor: `${project.color}1f`, color: project.color }}
      title={`Proyecto: ${project.name}`}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
      <span className="truncate">{project.name}</span>
    </span>
  );
}

// Selector de proyecto con búsqueda. Permite "Sin proyecto".
export default function ProjectPicker({ value, onChange, disabled = false, size = "md", id }: ProjectPickerProps) {
  const { projects, loaded } = useProjectOptions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = value ? projects.find((p) => p.id === value) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;
  }, [projects, query]);

  // Opciones navegables: "Sin proyecto" primero (solo sin búsqueda) y luego los proyectos
  const items: (ProjectOption | null)[] = query.trim() ? filtered : [null, ...filtered];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    const idx = value ? projects.findIndex((p) => p.id === value) + 1 : 0;
    setHighlight(Math.max(0, idx));
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const choose = (project: ProjectOption | null) => {
    onChange(project ? project.id : null);
    setOpen(false);
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (items[highlight] !== undefined) choose(items[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const isSm = size === "sm";

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `Proyecto: ${selected.name}` : "Elegir proyecto"}
        className={`flex items-center gap-2 max-w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-left outline-none transition-all duration-150 font-[inherit] hover:border-[#3a3a44] focus-visible:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed ${
          isSm ? "rounded-lg px-2 py-1 text-[0.75rem]" : "rounded-xl px-3 py-2 text-[0.8125rem]"
        } ${open ? "border-[var(--accent)]" : ""}`}
      >
        {selected ? (
          <>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="truncate text-[var(--foreground)]">{selected.name}</span>
          </>
        ) : (
          <>
            <svg className="flex-shrink-0 text-zinc-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="truncate text-zinc-500">Sin proyecto</span>
          </>
        )}
        <svg className="flex-shrink-0 ml-auto text-zinc-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-[60] w-64 max-w-[80vw] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden animate-[fadeIn_0.1s_ease]">
          <div className="p-2 border-b border-[var(--card-border)]">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onSearchKey}
              placeholder="Buscar proyecto..."
              aria-label="Buscar proyecto"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 text-[0.8125rem] text-[var(--foreground)] outline-none placeholder:text-zinc-600 focus:border-[var(--accent)]"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1 list-none m-0">
            {!loaded && projects.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-500">Cargando proyectos...</li>
            )}
            {loaded && items.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-500">
                {projects.length === 0 ? (
                  <>
                    No tenés proyectos.{" "}
                    <Link href="/proyectos" className="text-[var(--accent-hover)]">
                      Crear uno
                    </Link>
                  </>
                ) : (
                  "Sin resultados"
                )}
              </li>
            )}
            {items.map((project, i) => {
              const isSelected = project ? project.id === value : value === null;
              return (
                <li
                  key={project?.id ?? "none"}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(project);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-[0.8125rem] cursor-pointer ${
                    i === highlight ? "bg-[rgba(99,102,241,0.12)]" : ""
                  }`}
                >
                  {project ? (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 border border-zinc-600" />
                  )}
                  <span className={`truncate ${project ? "text-neutral-200" : "text-neutral-500"}`}>
                    {project ? project.name : "Sin proyecto"}
                  </span>
                  {isSelected && (
                    <svg className="ml-auto flex-shrink-0 text-[var(--accent-hover)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
