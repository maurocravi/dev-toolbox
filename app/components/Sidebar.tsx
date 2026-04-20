"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    label: "Time Tracker",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: "Proyectos",
    href: "/proyectos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      // Hard redirect para limpiar por completo el estado de React y cualquier caché en memoria
      window.location.href = "/login";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-60 min-h-screen bg-[var(--card-bg)] border-r border-[var(--card-border)] flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 pt-6 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <span className="text-[0.9375rem] font-semibold text-[var(--foreground)] tracking-tight">QA Toolbox</span>
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-[0.8125rem] font-medium no-underline transition-all duration-150 border-l-[3px] border-l-transparent ${
                    isActive
                      ? "bg-[rgba(99,102,241,0.1)] text-[var(--accent-hover)] border-l-[var(--accent)]"
                      : "text-zinc-500 hover:bg-[rgba(99,102,241,0.06)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span className="flex items-center justify-center flex-shrink-0">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-5 border-t border-[var(--card-border)]">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[0.8125rem] font-medium text-zinc-500 transition-all duration-200 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--danger)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
          <span className="whitespace-nowrap">{isLoggingOut ? "Saliendo..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
  );
}
