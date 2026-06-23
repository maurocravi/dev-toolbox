"use client";

import { useEffect, useCallback } from "react";
import type { Note } from "../types";

interface NoteDetailsModalProps {
  note: Note;
  onClose: () => void;
  onEdit: (id: string) => void;
}

export default function NoteDetailsModal({ note, onClose, onEdit }: NoteDetailsModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.15s_ease]"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[640px] max-h-[85vh] overflow-y-auto custom-scrollbar p-6 animate-[slideUp_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: note.color }} />
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] font-semibold text-[var(--foreground)] m-0 truncate">{note.title || "Sin título"}</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5 leading-snug">
                {new Date(note.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
              onClick={() => onEdit(note.id)}
              aria-label="Editar nota"
              title="Editar nota"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)]"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {note.content ? (
          <p className="text-[0.875rem] text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words m-0">{note.content}</p>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-8 m-0">Esta nota no tiene contenido.</p>
        )}
      </div>
    </div>
  );
}
