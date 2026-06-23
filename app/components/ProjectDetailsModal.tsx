"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, ProjectLink, ProjectAccount, ProjectFolder, generateUUID } from "../types";
import LinksAccountsManager from "./LinksAccountsManager";
import FolderDetailsModal from "./FolderDetailsModal";

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
}

const FOLDER_COLORS = [
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

const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[0];

export default function ProjectDetailsModal({
  project,
  onClose,
  onUpdate,
}: ProjectDetailsModalProps) {
  const [links, setLinks] = useState<ProjectLink[]>(project.links);
  const [accounts, setAccounts] = useState<ProjectAccount[]>(project.accounts);
  const [folders, setFolders] = useState<ProjectFolder[]>(project.folders);
  const [saving, setSaving] = useState(false);

  const [showFolderForm, setShowFolderForm] = useState(false);
  const [formFolderName, setFormFolderName] = useState("");
  const [formFolderColor, setFormFolderColor] = useState(DEFAULT_FOLDER_COLOR);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Keep local state in sync if the parent swaps the project
  useEffect(() => {
    setLinks(project.links);
    setAccounts(project.accounts);
    setFolders(project.folders);
  }, [project]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Let the nested folder modal handle Escape when it's open
      if (e.key === "Escape" && !selectedFolderId) handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, selectedFolderId]);

  const persist = useCallback(
    (newLinks: ProjectLink[], newAccounts: ProjectAccount[], newFolders: ProjectFolder[]) => {
      setSaving(true);
      setLinks(newLinks);
      setAccounts(newAccounts);
      setFolders(newFolders);
      onUpdate({ ...project, links: newLinks, accounts: newAccounts, folders: newFolders });
      setSaving(false);
    },
    [project, onUpdate]
  );

  const resetFolderForm = () => {
    setShowFolderForm(false);
    setFormFolderName("");
    setFormFolderColor(DEFAULT_FOLDER_COLOR);
    setEditingFolderId(null);
    setFolderError(null);
  };

  const handleSaveFolder = () => {
    const trimmedName = formFolderName.trim();
    if (!trimmedName) {
      setFolderError("El nombre es obligatorio.");
      return;
    }

    let newFolders: ProjectFolder[];
    if (editingFolderId !== null) {
      newFolders = folders.map((f) =>
        f.id === editingFolderId ? { ...f, name: trimmedName, color: formFolderColor } : f
      );
    } else {
      newFolders = [
        ...folders,
        { id: generateUUID(), name: trimmedName, color: formFolderColor, links: [], accounts: [] },
      ];
    }

    persist(links, accounts, newFolders);
    resetFolderForm();
  };

  const handleEditFolder = (folder: ProjectFolder) => {
    setFormFolderName(folder.name);
    setFormFolderColor(folder.color);
    setEditingFolderId(folder.id);
    setShowFolderForm(true);
    setFolderError(null);
  };

  const handleDeleteFolder = (id: string) => {
    persist(links, accounts, folders.filter((f) => f.id !== id));
  };

  const handleFolderChange = (updated: ProjectFolder) => {
    persist(links, accounts, folders.map((f) => (f.id === updated.id ? updated : f)));
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.15s_ease]"
        onClick={handleClose}
      >
        <div
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[1040px] max-h-[85vh] overflow-y-auto custom-scrollbar p-6 animate-[slideUp_0.2s_ease]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
              <div>
                <h2 className="text-[1.0625rem] font-semibold text-[var(--foreground)] m-0">{project.name}</h2>
                {project.description && <p className="text-xs text-zinc-500 m-0 mt-0.5 leading-snug">{project.description}</p>}
              </div>
            </div>
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

          {/* Folders section */}
          <div className="flex flex-col mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--foreground)] m-0 uppercase tracking-wider">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Carpetas
              </h3>
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-md bg-[rgba(99,102,241,0.1)] border-none text-[var(--accent)] text-[0.6875rem] font-semibold cursor-pointer transition-all duration-150 font-[inherit] hover:bg-[rgba(99,102,241,0.18)] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  setShowFolderForm(true);
                  setEditingFolderId(null);
                  setFormFolderName("");
                  setFormFolderColor(DEFAULT_FOLDER_COLOR);
                  setFolderError(null);
                }}
                disabled={showFolderForm || saving}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar carpeta
              </button>
            </div>

            {/* Folder form */}
            {showFolderForm && (
              <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-3.5 mb-3">
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Nombre</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="text"
                    placeholder="USA, Staging, Cliente X..."
                    value={formFolderName}
                    onChange={(e) => {
                      setFormFolderName(e.target.value);
                      if (folderError) setFolderError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveFolder();
                    }}
                    autoFocus
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Color</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-150 hover:scale-[1.15] ${
                          formFolderColor === c ? "border-[var(--foreground)] shadow-[0_0_0_2px_var(--card-bg),0_0_0_4px_var(--accent)]" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormFolderColor(c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                {folderError && <p className="text-xs text-[var(--danger)] mt-1.5">{folderError}</p>}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[var(--card-border)]">
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border border-[var(--input-border)] bg-transparent text-zinc-500 cursor-pointer transition-all duration-200 font-[inherit] hover:bg-white/4 hover:text-[var(--foreground)]"
                    onClick={resetFolderForm}
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)]"
                    onClick={handleSaveFolder}
                  >
                    {editingFolderId !== null ? "Guardar Cambios" : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            {/* Folder cards */}
            {folders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group flex items-center justify-between gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 cursor-pointer transition-[border-color] duration-150 hover:border-[#2a2a32]"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={folder.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="text-[0.8125rem] font-semibold text-[var(--foreground)] truncate">{folder.name}</span>
                      <span className="text-[0.6875rem] text-zinc-600 flex-shrink-0">
                        {folder.links.length + folder.accounts.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFolderId(folder.id);
                        }}
                        aria-label="Ver carpeta"
                        title="Ver carpeta"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFolder(folder);
                        }}
                        aria-label="Editar carpeta"
                        title="Editar carpeta"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        aria-label={`Eliminar ${folder.name}`}
                        title="Eliminar carpeta"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project-level links & accounts */}
          <LinksAccountsManager
            links={links}
            accounts={accounts}
            onChange={(newLinks, newAccounts) => persist(newLinks, newAccounts, folders)}
            saving={saving}
          />
        </div>
      </div>

      {selectedFolder && (
        <FolderDetailsModal
          folder={selectedFolder}
          projectName={project.name}
          onClose={() => setSelectedFolderId(null)}
          onChange={handleFolderChange}
        />
      )}
    </>
  );
}
