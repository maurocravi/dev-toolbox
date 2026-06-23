"use client";

import { useEffect, useCallback } from "react";
import { ProjectFolder, ProjectLink, ProjectAccount } from "../types";
import LinksAccountsManager from "./LinksAccountsManager";

interface FolderDetailsModalProps {
  folder: ProjectFolder;
  projectName: string;
  onClose: () => void;
  onChange: (updated: ProjectFolder) => void;
}

export default function FolderDetailsModal({
  folder,
  projectName,
  onClose,
  onChange,
}: FolderDetailsModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const handleManagerChange = (links: ProjectLink[], accounts: ProjectAccount[]) => {
    onChange({ ...folder, links, accounts });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-[fadeIn_0.15s_ease]"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[1040px] max-h-[85vh] overflow-y-auto custom-scrollbar p-6 animate-[slideUp_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)] flex-shrink-0"
              onClick={handleClose}
              aria-label="Volver"
              title="Volver al proyecto"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={folder.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <div className="min-w-0">
              <h2 className="text-[1.0625rem] font-semibold text-[var(--foreground)] m-0 truncate">{folder.name}</h2>
              <p className="text-xs text-zinc-500 m-0 mt-0.5 leading-snug truncate">{projectName}</p>
            </div>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)] flex-shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <LinksAccountsManager
          links={folder.links}
          accounts={folder.accounts}
          onChange={handleManagerChange}
        />
      </div>
    </div>
  );
}
