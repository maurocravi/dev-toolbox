import { storage } from "./storage";

const ALARM_NAME = "qb-timer-tick";

const ICON_DEFAULT = {
  16: "icons/icon16.png",
  32: "icons/icon32.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png",
};

const ICON_GREEN = {
  16: "icons/icon16-green.png",
  32: "icons/icon32-green.png",
  48: "icons/icon48-green.png",
  128: "icons/icon128-green.png",
};

// Listen for messages from popup
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
    return true; // async response
  }
  return false;
});

// Alarm tick every 1 second (keeps service worker alive)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    // No badge text needed; the green icon itself is the indicator
    // We just need the alarm to keep the SW alive
  }
});

async function getElapsed(): Promise<number> {
  const timer = await storage.getTimer();
  if (!timer.isRunning || !timer.startTime) return 0;
  const start = new Date(timer.startTime).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}
