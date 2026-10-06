/* background.js – service worker for JobPilot extension */

const API_BASE = "http://localhost:8001"; // swap to prod URL when deployed
const JOBPILOT_URL = "http://localhost:5173"; // swap to prod URL when deployed

// ─── fetch current user from backend session ───────────────────────────────
async function fetchMe() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── add a single email via the dedicated extension endpoint ───────────────
async function addEmailToSheet(email) {
  const res = await fetch(`${API_BASE}/sheet/add`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
  if (res.status === 422) throw new Error("INVALID_EMAIL");
  if (!res.ok) throw new Error("UNKNOWN");

  const data = await res.json();
  if (data.added === false) throw new Error("DUPLICATE");
  return data;
}


//  Open sidebar
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);


// ─── message handler ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_AUTH") {
    fetchMe()
      .then((user) => sendResponse({ user: user ?? null }))
      .catch(() => sendResponse({ user: null }));
    return true; // keep port open for async response
  }

  if (msg.type === "LOGIN_SUCCESS") {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;
  (async () => {
    if (tabId) await chrome.tabs.remove(tabId).catch(() => {});
    try {
      await chrome.sidePanel.open({ windowId }); // may need a user gesture
    } catch {
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 5000);
    }
    // tell an already-open panel to re-check auth
    chrome.runtime.sendMessage({ type: "AUTH_CHANGED" }).catch(() => {});
  })();
  sendResponse({ ok: true });
}

  if (msg.type === "ADD_EMAIL") {
    addEmailToSheet(msg.email)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) =>
        sendResponse({ ok: false, error: err.message || "UNKNOWN" })
      );
    return true;
  }

  if (msg.type === "OPEN_LOGIN") {
    chrome.tabs.create({ url: `${JOBPILOT_URL}?from=extension` });
    sendResponse({ ok: true });
  }

  if (msg.type === "OPEN_SHEET") {
    chrome.tabs.create({ url: `${JOBPILOT_URL}/sheet` });
    sendResponse({ ok: true });
  }
});
