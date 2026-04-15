"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TimeLog } from "../types";

interface TimerInputProps {
  onLogCreated: (log: TimeLog) => Promise<void>;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TimerInput({ onLogCreated }: TimerInputProps) {
  const [taskName, setTaskName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const stopTimer = useCallback(async () => {
    if (!startTimeRef.current) return;

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - startTimeRef.current.getTime()) / 1000
    );

    const log: TimeLog = {
      id: crypto.randomUUID(),
      taskName: taskName.trim() || "Tarea sin nombre",
      startTime: startTimeRef.current.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    };

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;

    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setSaving(true);

    await onLogCreated(log);

    setSaving(false);
    setTaskName("");
  }, [taskName, onLogCreated]);

  const startTimer = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    startTimeRef.current = now;
    setIsRunning(true);
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTime]);

  const handleToggle = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-6 transition-[border-color] duration-200 hover:border-[#2a2a32]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Time Tracker
        </span>
      </div>

      {/* Task Name Input */}
      <input
        id="task-name-input"
        type="text"
        placeholder="¿En qué estás trabajando?"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        disabled={isRunning}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isRunning && taskName.trim()) {
            startTimer();
          }
        }}
        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[0.875rem] text-[var(--foreground)] outline-none transition-all duration-200 font-[inherit] placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
      />

      {/* Timer Display + Button */}
      <div className="flex items-center justify-between mt-5">
        <div className="font-mono text-2xl font-semibold tracking-wider leading-none text-[#3a3a44]">
          <span className={isRunning ? "![color:var(--foreground)] [text-shadow:0_0_20px_rgba(99,102,241,0.3)]" : ""}>
            {formatTime(elapsed)}
          </span>
        </div>

        <button
          id="timer-toggle-btn"
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer transition-all duration-200 font-[inherit] ${
            isRunning
              ? "bg-[rgba(239,68,68,0.15)] text-[var(--danger)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.25)] hover:text-[var(--danger-hover)]"
              : "bg-[var(--accent)] text-white shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:-translate-y-px"
          }`}
          aria-label={isRunning ? "Detener timer" : "Iniciar timer"}
        >
          {isRunning ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3.5L14.5 9L5 14.5V3.5Z" fill="currentColor" />
            </svg>
          )}
          <span>{isRunning ? "Detener" : "Iniciar"}</span>
        </button>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-[pulse_2s_ease-in-out_infinite] flex-shrink-0" />
          Registrando tiempo para{" "}
          <span className="font-semibold text-emerald-300">
            {taskName.trim() || "Tarea sin nombre"}
          </span>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="mt-4 flex items-center gap-2 text-xs text-violet-400">
          <div className="w-3.5 h-3.5 border-2 border-[rgba(99,102,241,0.2)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span>Guardando registro...</span>
        </div>
      )}
    </div>
  );
}
