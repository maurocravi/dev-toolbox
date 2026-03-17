"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TimeLog } from "../types";

interface TimerInputProps {
  onLogCreated: (log: TimeLog) => void;
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const stopTimer = useCallback(() => {
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

    onLogCreated(log);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;

    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setTaskName("");
  }, [taskName, onLogCreated]);

  const startTimer = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    startTimeRef.current = now;
    setIsRunning(true);
    setElapsed(0);
  }, []);

  // Tick effect
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
    <div className="timer-card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="timer-dot" />
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
        className="timer-input"
      />

      {/* Timer Display + Button */}
      <div className="flex items-center justify-between mt-5">
        <div className="timer-display">
          <span className={isRunning ? "timer-active" : ""}>
            {formatTime(elapsed)}
          </span>
        </div>

        <button
          id="timer-toggle-btn"
          onClick={handleToggle}
          className={`timer-btn ${isRunning ? "timer-btn-stop" : "timer-btn-play"}`}
          aria-label={isRunning ? "Detener timer" : "Iniciar timer"}
        >
          {isRunning ? (
            /* Stop icon */
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            /* Play icon */
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 3.5L14.5 9L5 14.5V3.5Z"
                fill="currentColor"
              />
            </svg>
          )}
          <span>{isRunning ? "Detener" : "Iniciar"}</span>
        </button>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
          <span className="pulse-dot" />
          Registrando tiempo para{" "}
          <span className="font-semibold text-emerald-300">
            {taskName.trim() || "Tarea sin nombre"}
          </span>
        </div>
      )}
    </div>
  );
}
