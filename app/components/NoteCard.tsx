"use client";

import type { Note } from "../types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function NoteCard({ note, onDelete, onView, onEdit }: NoteCardProps) {
  return (
    <div
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 transition-all duration-200 flex flex-col gap-3 cursor-pointer hover:border-[#2a2a32] hover:bg-[#181820] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      onClick={() => onView(note.id)}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: note.color }} />
        <h3 className="text-[0.9375rem] font-semibold text-[var(--foreground)] m-0 leading-snug line-clamp-1">
          {note.title || "Sin título"}
        </h3>
      </div>
      {note.content && (
        <p className="text-[0.8125rem] text-zinc-500 m-0 leading-relaxed line-clamp-3 whitespace-pre-wrap">{note.content}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--card-border)]">
        <span className="text-[0.6875rem] text-zinc-600 font-mono">
          {new Date(note.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
            onClick={(e) => {
              e.stopPropagation();
              onView(note.id);
            }}
            aria-label={`Ver nota ${note.title}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note.id);
            }}
            aria-label={`Editar nota ${note.title}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)]"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            aria-label={`Eliminar nota ${note.title}`}
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
