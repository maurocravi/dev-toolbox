"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setMessage("Registro exitoso. Revisa tu email para confirmar la cuenta.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.04) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">QA Toolbox</h1>
          <p className="text-sm text-zinc-500 mt-1">Navaja suiza para QA</p>
        </div>

        <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-[var(--card-border)]">
          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all duration-200 ${
              mode === "login"
                ? "bg-[var(--accent)] text-white shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
                : "text-zinc-500 hover:text-[var(--foreground)]"
            }`}
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`flex-1 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all duration-200 ${
              mode === "register"
                ? "bg-[var(--accent)] text-white shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
                : "text-zinc-500 hover:text-[var(--foreground)]"
            }`}
            onClick={() => {
              setMode("register");
              setError(null);
              setMessage(null);
            }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[0.8125rem] font-medium text-[var(--foreground)] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[0.8125rem] font-medium text-[var(--foreground)] mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3 text-[0.8125rem] text-[var(--danger-hover)]">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-xl px-4 py-3 text-[0.8125rem] text-emerald-400">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[0.875rem] font-semibold border-none bg-[var(--accent)] text-white cursor-pointer transition-all duration-200 font-[inherit] shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "login" ? "Ingresando..." : "Registrando..."}
              </>
            ) : mode === "login" ? (
              "Ingresar"
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
