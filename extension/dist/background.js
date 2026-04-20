"use strict";
(() => {
  // extension/src/storage.ts
  var TIMER_KEY = "qb_timer";
  var storage = {
    async getTimer() {
      const result = await chrome.storage.local.get(TIMER_KEY);
      return result[TIMER_KEY] ?? {
        isRunning: false,
        logId: null,
        taskName: "",
        startTime: null
      };
    },
    async setTimer(state) {
      await chrome.storage.local.set({ [TIMER_KEY]: state });
    },
    async clearTimer() {
      await chrome.storage.local.remove(TIMER_KEY);
    }
  };

  // extension/src/background.ts
  var ALARM_NAME = "qb-timer-tick";
  var ICON_DEFAULT = {
    16: "icons/icon16.png",
    32: "icons/icon32.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png"
  };
  var ICON_GREEN = {
    16: "icons/icon16-green.png",
    32: "icons/icon32-green.png",
    48: "icons/icon48-green.png",
    128: "icons/icon128-green.png"
  };
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "START_TIMER") {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
      chrome.action.setIcon({ path: ICON_GREEN });
      chrome.action.setBadgeText({ text: "" });
      sendResponse({ ok: true });
    } else if (message.type === "STOP_TIMER") {
      chrome.alarms.clear(ALARM_NAME);
      chrome.action.setIcon({ path: ICON_DEFAULT });
      chrome.action.setBadgeText({ text: "" });
      sendResponse({ ok: true });
    } else if (message.type === "GET_ELAPSED") {
      getElapsed().then(sendResponse);
      return true;
    }
    return false;
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
    }
  });
  async function getElapsed() {
    const timer = await storage.getTimer();
    if (!timer.isRunning || !timer.startTime) return 0;
    const start = new Date(timer.startTime).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1e3);
  }
})();
//# sourceMappingURL=background.js.map
