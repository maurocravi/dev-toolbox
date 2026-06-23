"use client";

import { useState, useEffect, useCallback } from "react";
import type { Note } from "../types";

export interface NoteFormData {
  title: string;
  color: string;
  content: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData) => void;
  note?: Note | null;
}

const DEFAULT_COLORS = [
  "#94a3b8", // slate (default)
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

const DEFAULT_COLOR = DEFAULT_COLORS[0];

export default function NoteModal({ isOpen, onClose, onSave, note }: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setColor(note.color);
      setContent(note.content);
      setError(null);
    } else if (isOpen) {
      setTitle("");
      setColor(DEFAULT_COLOR);
      setContent("");
      setError(null);
    }
  }, [isOpen, note]);

  const handleClose = useCallback(() => {
    setTitle("");
    setColor(DEFAULT_COLOR);
    setContent("");
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título es obligatorio.");
      return;
    }
    onSave({ title: trimmedTitle, color, content: content.trim() });
    handleClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.15s_ease]"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[520px] p-6 animate-[slideUp_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.0625rem] font-semibold text-[var(--foreground)] m-0">{note ? "Editar Nota" : "Nueva Nota"}</h2>
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

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-5">
            <label className="block text-[0.8125rem] font-medium text-[var(--foreground)] mb-2" htmlFor="note-title">
              Título <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="note-title"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              type="text"
              placeholder="Ej: Pasos para deploy"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
            {error && <p className="text-xs text-[var(--danger)] mt-1.5">{error}</p>}
          </div>

          {/* Color */}
          <div className="mb-5">
            <label className="block text-[0.8125rem] font-medium text-[var(--foreground)] mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all duration-150 flex-shrink-0 hover:scale-[1.15] ${
                    color === c ? "border-[var(--foreground)] shadow-[0_0_0_2px_var(--card-bg),0_0_0_4px_var(--accent)]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Seleccionar color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-5">
            <label className="block text-[0.8125rem] font-medium text-[var(--foreground)] mb-2" htmlFor="note-content">
              Contenido
            </label>
            <textarea
              id="note-content"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 resize-vertical min-h-[160px] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              placeholder="Escribe tu nota aquí..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-[var(--card-border)]">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold border border-[var(--input-border)] bg-transparent text-zinc-500 cursor-pointer transition-all duration-200 font-[inherit] hover:bg-white/4 hover:text-[var(--foreground)]"
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px"
            >
              {note ? "Guardar Cambios" : "Crear Nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
