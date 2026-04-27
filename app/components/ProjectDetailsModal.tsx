"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, ProjectLink, ProjectAccount } from "../types";

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
}

const LINK_COLORS = ["blue", "red"] as const;
const ACCOUNT_COLORS = ["blue", "red"] as const;

const LINK_COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  blue: {
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#60a5fa",
    dot: "#3b82f6",
  },
  red: {
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#f87171",
    dot: "#ef4444",
  },
};

const ACCOUNT_COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  blue: {
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#60a5fa",
    dot: "#3b82f6",
  },
  red: {
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#f87171",
    dot: "#ef4444",
  },
};

export default function ProjectDetailsModal({
  project,
  onClose,
  onUpdate,
}: ProjectDetailsModalProps) {
  const [links, setLinks] = useState<ProjectLink[]>(project.links);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [formLinkLabel, setFormLinkLabel] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formLinkColor, setFormLinkColor] = useState<"blue" | "red">("blue");
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);

  const [accounts, setAccounts] = useState<ProjectAccount[]>(project.accounts);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [formAccountLabel, setFormAccountLabel] = useState("");
  const [formAccountUsername, setFormAccountUsername] = useState("");
  const [formAccountPassword, setFormAccountPassword] = useState("");
  const [formAccountColor, setFormAccountColor] = useState<"blue" | "red">("blue");
  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<number | null>(null);
  const [copiedPassId, setCopiedPassId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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

  const persistProject = useCallback(
    async (newLinks: ProjectLink[], newAccounts: ProjectAccount[]) => {
      setSaving(true);
      const updatedProject = { ...project, links: newLinks, accounts: newAccounts };
      onUpdate(updatedProject);
      setLinks(newLinks);
      setAccounts(newAccounts);
      setSaving(false);
    },
    [project, onUpdate]
  );

  const handleAddLink = () => {
    const trimmedLabel = formLinkLabel.trim();
    const trimmedUrl = formUrl.trim();
    if (!trimmedLabel) {
      setFormError("El label es obligatorio.");
      return;
    }
    if (!trimmedUrl) {
      setFormError("La URL es obligatoria.");
      return;
    }

    const newLink: ProjectLink = {
      label: trimmedLabel,
      url: trimmedUrl,
      color: formLinkColor,
    };

    const newLinks =
      editingLinkIndex !== null
        ? links.map((l, i) => (i === editingLinkIndex ? newLink : l))
        : [...links, newLink];

    persistProject(newLinks, accounts);
    setFormLinkLabel("");
    setFormUrl("");
    setFormLinkColor("blue");
    setFormError(null);
    setShowLinkForm(false);
    setEditingLinkIndex(null);
  };

  const handleDeleteLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    persistProject(newLinks, accounts);
  };

  const handleEditLink = (index: number) => {
    const link = links[index];
    setFormLinkLabel(link.label);
    setFormUrl(link.url);
    setFormLinkColor(link.color);
    setEditingLinkIndex(index);
    setShowLinkForm(true);
    setShowAccountForm(false);
    setFormError(null);
  };

  const handleCopyUrl = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(index);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLinkId(index);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const handleAddAccount = () => {
    const trimmedLabel = formAccountLabel.trim();
    const trimmedUser = formAccountUsername.trim();
    const trimmedPass = formAccountPassword.trim();
    if (!trimmedUser) {
      setFormError("El usuario es obligatorio.");
      return;
    }
    if (!trimmedPass) {
      setFormError("La contraseña es obligatoria.");
      return;
    }

    const newAccount: ProjectAccount = {
      name: trimmedLabel || trimmedUser,
      username: trimmedUser,
      password: trimmedPass,
      color: formAccountColor,
    };

    const newAccounts =
      editingAccountIndex !== null
        ? accounts.map((a, i) => (i === editingAccountIndex ? newAccount : a))
        : [...accounts, newAccount];

    persistProject(links, newAccounts);
    setFormAccountLabel("");
    setFormAccountUsername("");
    setFormAccountPassword("");
    setFormAccountColor("blue");
    setFormError(null);
    setShowAccountForm(false);
    setEditingAccountIndex(null);
  };

  const handleDeleteAccount = (index: number) => {
    const newAccounts = accounts.filter((_, i) => i !== index);
    persistProject(links, newAccounts);
  };

  const handleEditAccount = (index: number) => {
    const account = accounts[index];
    setFormAccountLabel(account.name === account.username ? "" : account.name);
    setFormAccountUsername(account.username);
    setFormAccountPassword(account.password);
    setFormAccountColor(account.color);
    setEditingAccountIndex(index);
    setShowAccountForm(true);
    setShowLinkForm(false);
    setFormError(null);
  };

  const handleCopyText = async (text: string, setId: (id: number | null) => void, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setId(index);
      setTimeout(() => setId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setId(index);
      setTimeout(() => setId(null), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.15s_ease]"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[720px] max-h-[85vh] overflow-y-auto custom-scrollbar p-6 animate-[slideUp_0.2s_ease]"
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

        {/* Two column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Links Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--foreground)] m-0 uppercase tracking-wider">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                URLs
              </h3>
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-md bg-[rgba(99,102,241,0.1)] border-none text-[var(--accent)] text-[0.6875rem] font-semibold cursor-pointer transition-all duration-150 font-[inherit] hover:bg-[rgba(99,102,241,0.18)] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  setShowLinkForm(true);
                  setShowAccountForm(false);
                  setFormError(null);
                  setEditingLinkIndex(null);
                  setFormLinkLabel("");
                  setFormUrl("");
                  setFormLinkColor("blue");
                }}
                disabled={showLinkForm || saving}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar
              </button>
            </div>

            {/* Link form */}
            {showLinkForm && (
              <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-3.5 mb-3">
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Label</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="text"
                    placeholder="GitHub, Staging..."
                    value={formLinkLabel}
                    onChange={(e) => {
                      setFormLinkLabel(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    autoFocus
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Color</label>
                  <div className="flex gap-1.5">
                    {LINK_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-150 hover:scale-[1.15] ${
                          formLinkColor === c ? "border-[var(--foreground)] shadow-[0_0_0_2px_var(--card-bg),0_0_0_4px_var(--accent)]" : "border-transparent"
                        }`}
                        style={{ backgroundColor: LINK_COLOR_MAP[c].dot }}
                        onClick={() => setFormLinkColor(c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">URL</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="url"
                    placeholder="https://..."
                    value={formUrl}
                    onChange={(e) => {
                      setFormUrl(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                {formError && <p className="text-xs text-[var(--danger)] mt-1.5">{formError}</p>}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[var(--card-border)]">
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border border-[var(--input-border)] bg-transparent text-zinc-500 cursor-pointer transition-all duration-200 font-[inherit] hover:bg-white/4 hover:text-[var(--foreground)]"
                    onClick={() => {
                      setShowLinkForm(false);
                      setFormLinkLabel("");
                      setFormUrl("");
                      setFormLinkColor("blue");
                      setEditingLinkIndex(null);
                      setFormError(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)]"
                    onClick={handleAddLink}
                  >
                    {editingLinkIndex !== null ? "Guardar Cambios" : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            {/* Links list */}
            <div className="flex flex-col gap-2">
              {links.map((link, index) => {
                const colors = LINK_COLOR_MAP[link.color] || LINK_COLOR_MAP.blue;
                return (
                  <div key={index} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 transition-[border-color] duration-150 hover:border-[#2a2a32]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--foreground)]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                        <span>{link.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                          onClick={() => handleEditLink(index)}
                          aria-label="Editar URL"
                          title="Editar URL"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                          onClick={() => handleCopyUrl(link.url, index)}
                          aria-label="Copiar URL"
                          title="Copiar URL"
                        >
                          {copiedLinkId === index ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)]"
                          onClick={() => handleDeleteLink(index)}
                          aria-label={`Eliminar ${link.label}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="rounded-md px-2 py-1.5 break-all" style={{ backgroundColor: colors.bg }}>
                      <code className="text-[0.6875rem] font-mono text-[var(--foreground)] leading-snug">{link.url}</code>
                    </div>
                  </div>
                );
              })}
              {links.length === 0 && !showLinkForm && (
                <p className="text-sm text-zinc-600 text-center py-6 m-0">No hay URLs aún.</p>
              )}
            </div>
          </div>

          {/* Accounts Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--foreground)] m-0 uppercase tracking-wider">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Usuarios
              </h3>
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-md bg-[rgba(99,102,241,0.1)] border-none text-[var(--accent)] text-[0.6875rem] font-semibold cursor-pointer transition-all duration-150 font-[inherit] hover:bg-[rgba(99,102,241,0.18)] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  setShowAccountForm(true);
                  setShowLinkForm(false);
                  setFormError(null);
                  setEditingAccountIndex(null);
                  setFormAccountLabel("");
                  setFormAccountUsername("");
                  setFormAccountPassword("");
                  setFormAccountColor("blue");
                }}
                disabled={showAccountForm || saving}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar
              </button>
            </div>

            {/* Account form */}
            {showAccountForm && (
              <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-3.5 mb-3">
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Label (opcional)</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="text"
                    placeholder="Admin, Testing..."
                    value={formAccountLabel}
                    onChange={(e) => {
                      setFormAccountLabel(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    autoFocus
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Color</label>
                  <div className="flex gap-1.5">
                    {ACCOUNT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-150 hover:scale-[1.15] ${
                          formAccountColor === c ? "border-[var(--foreground)] shadow-[0_0_0_2px_var(--card-bg),0_0_0_4px_var(--accent)]" : "border-transparent"
                        }`}
                        style={{ backgroundColor: ACCOUNT_COLOR_MAP[c].dot }}
                        onClick={() => setFormAccountColor(c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Usuario</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="text"
                    placeholder="usuario@ejemplo.com"
                    value={formAccountUsername}
                    onChange={(e) => {
                      setFormAccountUsername(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-[0.6875rem] font-medium text-zinc-500 mb-1 uppercase tracking-wide">Contraseña</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[0.8125rem] text-[var(--foreground)] outline-none transition-all duration-150 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
                    type="text"
                    placeholder="••••••••"
                    value={formAccountPassword}
                    onChange={(e) => {
                      setFormAccountPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                {formError && <p className="text-xs text-[var(--danger)] mt-1.5">{formError}</p>}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[var(--card-border)]">
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border border-[var(--input-border)] bg-transparent text-zinc-500 cursor-pointer transition-all duration-200 font-[inherit] hover:bg-white/4 hover:text-[var(--foreground)]"
                    onClick={() => {
                      setShowAccountForm(false);
                      setFormAccountLabel("");
                      setFormAccountUsername("");
                      setFormAccountPassword("");
                      setFormAccountColor("blue");
                      setEditingAccountIndex(null);
                      setFormError(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex items-center justify-center px-3.5 py-1.75 rounded-lg text-xs font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)]"
                    onClick={handleAddAccount}
                  >
                    {editingAccountIndex !== null ? "Guardar Cambios" : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            {/* Accounts list */}
            <div className="flex flex-col gap-2">
              {accounts.map((account, index) => {
                const colors = ACCOUNT_COLOR_MAP[account.color] || ACCOUNT_COLOR_MAP.blue;
                return (
                  <div key={index} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 transition-[border-color] duration-150 hover:border-[#2a2a32]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--foreground)]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                        <span>{account.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                          onClick={() => handleEditAccount(index)}
                          aria-label="Editar usuario"
                          title="Editar usuario"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                          onClick={() => handleCopyText(account.username, setCopiedUserId, index)}
                          aria-label="Copiar usuario"
                          title="Copiar usuario"
                        >
                          {copiedUserId === index ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--accent-hover)]"
                          onClick={() => handleCopyText(account.password, setCopiedPassId, index)}
                          aria-label="Copiar contraseña"
                          title="Copiar contraseña"
                        >
                          {copiedPassId === index ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 cursor-pointer transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)]"
                          onClick={() => handleDeleteAccount(index)}
                          aria-label={`Eliminar ${account.name}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="rounded-md px-2 py-1.5 space-y-1" style={{ backgroundColor: colors.bg }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6875rem] text-zinc-400 uppercase tracking-wide w-16">Usuario</span>
                        <code className="text-[0.6875rem] font-mono text-[var(--foreground)] leading-snug">{account.username}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6875rem] text-zinc-400 uppercase tracking-wide w-16">Pass</span>
                        <code className="text-[0.6875rem] font-mono text-[var(--foreground)] leading-snug">{account.password}</code>
                      </div>
                    </div>
                  </div>
                );
              })}
              {accounts.length === 0 && !showAccountForm && (
                <p className="text-sm text-zinc-600 text-center py-6 m-0">No hay usuarios aún.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
