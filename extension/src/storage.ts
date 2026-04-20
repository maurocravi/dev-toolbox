import type { TimerState } from "./types";

const TIMER_KEY = "qb_timer";

export const storage = {
  async getTimer(): Promise<TimerState> {
    const result = await chrome.storage.local.get(TIMER_KEY);
    return (
      result[TIMER_KEY] ?? {
        isRunning: false,
        logId: null,
        taskName: "",
        startTime: null,
      }
    );
  },

  async setTimer(state: TimerState): Promise<void> {
    await chrome.storage.local.set({ [TIMER_KEY]: state });
  },

  async clearTimer(): Promise<void> {
    await chrome.storage.local.remove(TIMER_KEY);
  },
};
