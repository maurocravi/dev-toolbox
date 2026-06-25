"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pinta el botón de confirmar en rojo (borrados). */
  variant?: "danger" | "default";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Hook para pedir confirmación al usuario. Devuelve una promesa que se resuelve
 * en `true` si confirma y `false` si cancela.
 *
 * Uso:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "¿Borrar esto?", variant: "danger" }))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}

interface PendingState {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      if (pending) {
        pending.resolve(result);
        setPending(null);
      }
    },
    [pending]
  );

  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(false);
      } else if (e.key === "Enter") {
        e.stopPropagation();
        close(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-[fadeIn_0.15s_ease]"
          onClick={() => close(false)}
        >
          <div
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl w-full max-w-[420px] p-6 animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3.5">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    pending.options.variant === "danger"
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(99, 102, 241, 0.12)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={pending.options.variant === "danger" ? "var(--danger)" : "var(--accent)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-[var(--foreground)] m-0">
                  {pending.options.title ?? "¿Estás seguro?"}
                </h2>
                <p className="text-[0.8125rem] text-zinc-400 m-0 mt-1.5 leading-relaxed">
                  {pending.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-transparent border border-[var(--card-border)] text-[0.8125rem] font-medium text-zinc-400 cursor-pointer transition-all duration-150 hover:bg-white/6 hover:text-[var(--foreground)]"
                onClick={() => close(false)}
              >
                {pending.options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                ref={confirmBtnRef}
                className={`px-4 py-2 rounded-lg border-none text-[0.8125rem] font-medium text-white cursor-pointer transition-all duration-150 ${
                  pending.options.variant === "danger"
                    ? "bg-[var(--danger)] hover:bg-[var(--danger-hover)]"
                    : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                }`}
                onClick={() => close(true)}
              >
                {pending.options.confirmLabel ?? "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
