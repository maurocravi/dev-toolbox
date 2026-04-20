"use client";

import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export default function ProjectCard({ project, onDelete, onView }: ProjectCardProps) {
  return (
    <div
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 transition-all duration-200 flex flex-col gap-3 cursor-pointer hover:border-[#2a2a32] hover:bg-[#181820] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      onClick={() => onView(project.id)}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
        <h3 className="text-[0.9375rem] font-semibold text-[var(--foreground)] m-0 leading-snug">{project.name}</h3>
      </div>
      {project.description && (
        <p className="text-[0.8125rem] text-zinc-500 m-0 leading-relaxed line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--card-border)]">
        <span className="text-[0.6875rem] text-zinc-600 font-mono">
          Creado el {new Date(project.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
            onClick={(e) => {
              e.stopPropagation();
              onView(project.id);
            }}
            aria-label={`Ver detalles de ${project.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)]"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            aria-label={`Eliminar proyecto ${project.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
