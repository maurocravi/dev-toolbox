"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NoteModal, { NoteFormData } from "../components/NoteModal";
import NoteDetailsModal from "../components/NoteDetailsModal";
import NoteCard from "../components/NoteCard";
import PageHeader from "../components/PageHeader";
import ErrorBanner from "../components/ErrorBanner";
import { dbToNote, noteToDb, type DbNote, type Note } from "../types";
import { createClient } from "@/lib/supabase/client";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 6000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("notes")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching notes:", fetchError);
          setError("Error al cargar las notas.");
          setLoading(false);
          return;
        }

        setNotes((data as DbNote[]).map(dbToNote));
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching notes:", err);
        setError("Error al conectar con el servidor.");
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  const handleNewNote = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      setSelectedNote(null);
      setEditingNote(note);
      setIsModalOpen(true);
    }
  };

  const handleViewNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) setSelectedNote(note);
  };

  const handleSaveNote = useCallback(async (data: NoteFormData) => {
    const supabase = createClient();

    if (editingNote) {
      const updated: Note = {
        ...editingNote,
        title: data.title,
        color: data.color,
        content: data.content,
      };

      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      if (selectedNote?.id === updated.id) {
        setSelectedNote(updated);
      }
      setEditingNote(null);

      const { error: updateError } = await supabase
        .from("notes")
        .update({
          title: updated.title,
          color: updated.color,
          content: updated.content,
        })
        .eq("id", updated.id);

      if (updateError) {
        console.error("Error updating note:", updateError);
        showError("No se pudieron guardar los cambios de la nota.");
        const { data: refreshed } = await supabase
          .from("notes")
          .select("*")
          .order("created_at", { ascending: false });
        if (refreshed) setNotes((refreshed as DbNote[]).map(dbToNote));
      }
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const tempId = generateId();
    const now = new Date().toISOString();

    const tempNote: Note = {
      id: tempId,
      title: data.title,
      color: data.color,
      content: data.content,
      createdAt: now,
    };

    setNotes((prev) => [tempNote, ...prev]);

    const dbPayload = {
      ...noteToDb(tempNote),
      user_id: user?.id ?? null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("notes")
      .insert(dbPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting note:", insertError);
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      showError("No se pudo crear la nota. Probá de nuevo.");
      return;
    }

    const realNote = dbToNote(inserted as DbNote);
    setNotes((prev) => prev.map((n) => (n.id === tempId ? realNote : n)));
  }, [editingNote, selectedNote, showError]);

  const handleDeleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting note:", deleteError);
      showError("No se pudo eliminar la nota.");
      const { data } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNotes((data as DbNote[]).map(dbToNote));
    }
  }, [selectedNote, showError]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredNotes = normalizedQuery
    ? notes.filter((n) => {
        const haystack = [n.title, n.content].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : notes;

  return (
    <div className="min-h-screen flex justify-center py-8 px-4 bg-[var(--background)]"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-[800px] xl:max-w-[1040px]">
        <PageHeader
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          }
          title="Notas"
          subtitle="Guarda y organiza tus notas"
          right={
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px"
              onClick={handleNewNote}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva Nota
            </button>
          }
        />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-7 h-7 border-[3px] border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 mt-3">Cargando notas...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[#3a3a44] mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">No hay notas aún</h3>
            <p className="text-xs text-neutral-600">Comienza creando tu primera nota.</p>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-10 pr-10 py-2.5 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                type="text"
                placeholder="Buscar notas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar notas"
              />
              {query && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)]"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[#3a3a44] mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-neutral-400 mb-1">Sin resultados</h3>
                <p className="text-xs text-neutral-600">No hay notas que coincidan con &quot;{query}&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={handleDeleteNote}
                    onView={handleViewNote}
                    onEdit={handleEditNote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        note={editingNote}
      />

      {selectedNote && (
        <NoteDetailsModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onEdit={handleEditNote}
        />
      )}
    </div>
  );
}
