import { storage } from "../storage";
import {
  signIn,
  signOut,
  getCurrentUser,
  createLog,
  finishLog,
  fetchRecentLogs,
  deleteLog,
  updateLog,
} from "../supabase";
import type { TimeLog } from "../types";
import { formatDuration, formatDate } from "../types";

// ═══ DOM Elements ═══
const els = {
  // Sections
  loginSection: document.getElementById("login-section")!,
  timerSection: document.getElementById("timer-section")!,

  // Header
  headerActions: document.getElementById("header-actions")!,
  headerUser: document.getElementById("header-user")!,
  btnLogout: document.getElementById("btn-logout")!,

  // Login
  loginEmail: document.getElementById("login-email") as HTMLInputElement,
  loginPassword: document.getElementById("login-password") as HTMLInputElement,
  btnLogin: document.getElementById("btn-login")!,
  loginError: document.getElementById("login-error")!,

  // Timer
  taskInput: document.getElementById("task-input") as HTMLInputElement,
  timerDisplay: document.getElementById("timer-display")!,
  btnToggle: document.getElementById("btn-toggle")!,
  btnToggleText: document.getElementById("btn-toggle-text")!,
  iconPlay: document.getElementById("icon-play")!,
  iconStop: document.getElementById("icon-stop")!,
  runningIndicator: document.getElementById("running-indicator")!,
  runningTask: document.getElementById("running-task")!,
  savingIndicator: document.getElementById("saving-indicator")!,

  // Logs
  logsList: document.getElementById("logs-list")!,
  logsEmpty: document.getElementById("logs-empty")!,
  btnRefresh: document.getElementById("btn-refresh")!,

  // Edit Modal
  editModal: document.getElementById("edit-modal")!,
  btnEditClose: document.getElementById("btn-edit-close")!,
  btnEditCancel: document.getElementById("btn-edit-cancel")!,
  btnEditSave: document.getElementById("btn-edit-save")!,
  editTask: document.getElementById("edit-task") as HTMLInputElement,
  editStart: document.getElementById("edit-start") as HTMLInputElement,
  editEnd: document.getElementById("edit-end") as HTMLInputElement,
  editError: document.getElementById("edit-error")!,
  editSpinner: document.getElementById("edit-spinner")!,
};

// ═══ State ═══
let isRunning = false;
let currentLogId: string | null = null;
let currentTaskName = "";
let timerInterval: ReturnType<typeof setInterval> | null = null;
let editingLogId: string | null = null;

// ═══ Init ═══
async function init() {
  const user = await getCurrentUser();

  if (user) {
    showAuthenticated(user.email);
    const timer = await storage.getTimer();
    if (timer.isRunning && timer.startTime) {
      isRunning = true;
      currentLogId = timer.logId;
      currentTaskName = timer.taskName;
      els.taskInput.value = currentTaskName;
      els.taskInput.disabled = true;
      setTimerRunningUI(true);
      startLocalTick();
      // Ensure background icon is green (e.g. after browser restart)
      chrome.runtime.sendMessage({ type: "START_TIMER" });
    }
    await loadLogs();
  } else {
    showLogin();
  }
}

// ═══ Auth UI ═══
function showLogin() {
  els.loginSection.classList.remove("hidden");
  els.timerSection.classList.add("hidden");
  els.headerActions.classList.add("hidden");
}

function showAuthenticated(email: string) {
  els.loginSection.classList.add("hidden");
  els.timerSection.classList.remove("hidden");
  els.headerActions.classList.remove("hidden");
  els.headerUser.textContent = email;
}

// ═══ Login ═══
els.btnLogin.addEventListener("click", async () => {
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  if (!email || !password) {
    showLoginError("Completá email y contraseña.");
    return;
  }

  els.btnLogin.disabled = true;
  els.btnLogin.innerHTML = `<span class="spinner"></span><span>Ingresando...</span>`;

  try {
    const user = await signIn(email, password);
    showAuthenticated(user.email);
    await loadLogs();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al iniciar sesión.";
    showLoginError(msg);
  } finally {
    els.btnLogin.disabled = false;
    els.btnLogin.innerHTML = `<span>Ingresar</span>`;
  }
});

els.loginEmail.addEventListener("keydown", (e) => {
  if (e.key === "Enter") els.loginPassword.focus();
});
els.loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") els.btnLogin.click();
});

function showLoginError(msg: string) {
  els.loginError.textContent = msg;
  els.loginError.classList.remove("hidden");
}

// ═══ Logout ═══
els.btnLogout.addEventListener("click", async () => {
  await signOut();
  await storage.clearTimer();
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  currentLogId = null;
  resetTimerUI();
  showLogin();
});

// ═══ Timer Logic ═══
els.btnToggle.addEventListener("click", async () => {
  if (isRunning) {
    await stopTimer();
  } else {
    await startTimer();
  }
});

async function startTimer() {
  const taskName = els.taskInput.value.trim() || "Tarea sin nombre";

  try {
    els.btnToggle.disabled = true;
    const log = await createLog(taskName);

    isRunning = true;
    currentLogId = log.id;
    currentTaskName = taskName;

    await storage.setTimer({
      isRunning: true,
      logId: log.id,
      taskName,
      startTime: log.startTime,
    });

    // Tell background to start alarms
    chrome.runtime.sendMessage({ type: "START_TIMER" });

    els.taskInput.disabled = true;
    setTimerRunningUI(true);
    startLocalTick();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al iniciar el registro.";
    alert(msg);
  } finally {
    els.btnToggle.disabled = false;
  }
}

async function stopTimer() {
  if (!currentLogId) return;

  const timer = await storage.getTimer();
  if (!timer.startTime) return;

  try {
    els.btnToggle.disabled = true;
    els.savingIndicator.classList.remove("hidden");

    await finishLog(currentLogId, timer.startTime);

    // Stop everything
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    currentLogId = null;

    await storage.clearTimer();
    chrome.runtime.sendMessage({ type: "STOP_TIMER" });

    els.taskInput.value = "";
    els.taskInput.disabled = false;
    resetTimerUI();
    await loadLogs();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al guardar el registro.";
    alert(msg);
  } finally {
    els.savingIndicator.classList.add("hidden");
    els.btnToggle.disabled = false;
  }
}

function startLocalTick() {
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

async function updateTimerDisplay() {
  const timer = await storage.getTimer();
  if (!timer.isRunning || !timer.startTime) {
    els.timerDisplay.textContent = "00:00:00";
    els.timerDisplay.classList.remove("active");
    return;
  }

  const elapsed = Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000);
  els.timerDisplay.textContent = formatDuration(elapsed);
  els.timerDisplay.classList.add("active");
}

function setTimerRunningUI(running: boolean) {
  if (running) {
    els.btnToggle.classList.remove("btn-primary");
    els.btnToggle.classList.add("btn-danger");
    els.btnToggleText.textContent = "Detener";
    els.iconPlay.classList.add("hidden");
    els.iconStop.classList.remove("hidden");
    els.runningIndicator.classList.remove("hidden");
    els.runningTask.textContent = currentTaskName;
  } else {
    els.btnToggle.classList.remove("btn-danger");
    els.btnToggle.classList.add("btn-primary");
    els.btnToggleText.textContent = "Iniciar";
    els.iconPlay.classList.remove("hidden");
    els.iconStop.classList.add("hidden");
    els.runningIndicator.classList.add("hidden");
    els.runningTask.textContent = "";
  }
}

function resetTimerUI() {
  setTimerRunningUI(false);
  els.timerDisplay.textContent = "00:00:00";
  els.timerDisplay.classList.remove("active");
}

// ═══ Logs ═══
async function loadLogs() {
  try {
    const logs = await fetchRecentLogs(15);
    renderLogs(logs);
  } catch (err: unknown) {
    console.error("Error loading logs:", err);
    els.logsList.innerHTML = "";
    els.logsEmpty.textContent = "Error al cargar registros.";
    els.logsEmpty.classList.remove("hidden");
  }
}

els.btnRefresh.addEventListener("click", loadLogs);

function renderLogs(logs: TimeLog[]) {
  // Filter out the currently running log so it doesn't appear in the list
  const displayLogs = isRunning && currentLogId
    ? logs.filter((l) => l.id !== currentLogId)
    : logs;

  if (displayLogs.length === 0) {
    els.logsList.innerHTML = "";
    els.logsEmpty.classList.remove("hidden");
    return;
  }

  els.logsEmpty.classList.add("hidden");
  els.logsList.innerHTML = "";

  for (const log of displayLogs) {
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <div class="log-info">
        <div class="log-name">${escapeHtml(log.taskName)}</div>
        <div class="log-meta">${formatDate(log.startTime)}</div>
      </div>
      <div class="log-duration">${formatDuration(log.duration)}</div>
      <div class="log-actions">
        <button class="btn-icon btn-icon-sm btn-edit" data-id="${log.id}" title="Editar" aria-label="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="btn-icon btn-icon-sm btn-delete" data-id="${log.id}" title="Eliminar" aria-label="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    `;
    els.logsList.appendChild(item);
  }

  // Attach event listeners
  els.logsList.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.id!;
      openEditModal(id, logs);
    });
  });

  els.logsList.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.id!;
      handleDelete(id);
    });
  });
}

async function handleDelete(id: string) {
  if (!confirm("¿Eliminar este registro?")) return;
  try {
    await deleteLog(id);
    await loadLogs();
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : "Error al eliminar.");
  }
}

// ═══ Edit Modal ═══
function openEditModal(id: string, logs: TimeLog[]) {
  const log = logs.find((l) => l.id === id);
  if (!log) return;

  editingLogId = id;
  els.editTask.value = log.taskName;
  els.editStart.value = toDatetimeLocal(log.startTime);
  els.editEnd.value = toDatetimeLocal(log.endTime);
  els.editError.classList.add("hidden");
  els.editModal.classList.remove("hidden");
}

function closeEditModal() {
  editingLogId = null;
  els.editModal.classList.add("hidden");
}

els.btnEditClose.addEventListener("click", closeEditModal);
els.btnEditCancel.addEventListener("click", closeEditModal);
els.editModal.querySelector(".modal-backdrop")!.addEventListener("click", closeEditModal);

els.btnEditSave.addEventListener("click", async () => {
  if (!editingLogId) return;

  const taskName = els.editTask.value.trim();
  const startStr = els.editStart.value;
  const endStr = els.editEnd.value;

  if (!taskName || !startStr || !endStr) {
    showEditError("Completá todos los campos.");
    return;
  }

  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    showEditError("Fechas inválidas.");
    return;
  }

  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (duration < 0) {
    showEditError("La fecha de fin debe ser posterior a la de inicio.");
    return;
  }

  els.btnEditSave.disabled = true;
  els.editSpinner.classList.remove("hidden");

  try {
    await updateLog(editingLogId, {
      taskName,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
    });
    closeEditModal();
    await loadLogs();
  } catch (err: unknown) {
    showEditError(err instanceof Error ? err.message : "Error al guardar.");
  } finally {
    els.btnEditSave.disabled = false;
    els.editSpinner.classList.add("hidden");
  }
});

function showEditError(msg: string) {
  els.editError.textContent = msg;
  els.editError.classList.remove("hidden");
}

// ═══ Helpers ═══
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ═══ Start ═══
init();
