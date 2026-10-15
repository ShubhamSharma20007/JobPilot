/* background.js – service worker for JobPilot extension */

const ENV_LOCAL = {
  name: "local",
  api: "http://localhost:8001",
  web: "http://localhost:5173",
};

const ENV_PROD = {
  name: "production",
  api: "https://jobpilot-api-v1.duckdns.org",
  web: "https://jobpilot-1bc0e.firebaseapp.com",
};

let activeEnv = ENV_PROD;

// ─── retrieve session token from chrome cookies ────────────────────────────
async function getSessionToken(apiUrl) {
  if (chrome.cookies) {
    try {
      const cookie = await chrome.cookies.get({ url: apiUrl, name: "session" });
      if (cookie && cookie.value) return cookie.value;
    } catch {}
    try {
      // Also check all cookies named "session"
      const all = await chrome.cookies.getAll({ name: "session" });
      const host = new URL(apiUrl).hostname;
      const match = all.find(
        (c) =>
          c.domain.includes(host) || host.includes(c.domain.replace(/^\./, ""))
      );
      if (match && match.value) return match.value;
    } catch {}
  }
  return null;
}

// ─── test authentication on a specific environment ─────────────────────────
async function checkAuthOn(env) {
  try {
    const token = await getSessionToken(env.api);
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${env.api}/auth/me`, {
      credentials: "include",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── determine active environment and current user ─────────────────────────
async function fetchMe() {
  // Check if open tabs indicate user is working locally
  let preferLocal = false;
  try {
    const tabs = await chrome.tabs.query({});
    preferLocal = tabs.some(
      (t) =>
        t.url &&
        (t.url.startsWith("http://localhost:5173") ||
          t.url.startsWith("http://127.0.0.1:5173"))
    );
  } catch {}

  const order = preferLocal ? [ENV_LOCAL, ENV_PROD] : [ENV_PROD, ENV_LOCAL];

  for (const env of order) {
    const user = await checkAuthOn(env);
    if (user) {
      activeEnv = env;
      return { user, env };
    }
  }

  // If not logged in, determine which env to use for login
  if (preferLocal) {
    activeEnv = ENV_LOCAL;
  } else {
    // Quick check if local backend is up
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 300);
      const res = await fetch("http://localhost:8001/db-check", {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) activeEnv = ENV_LOCAL;
      else activeEnv = ENV_PROD;
    } catch {
      activeEnv = ENV_PROD;
    }
  }

  return { user: null, env: activeEnv };
}

// ─── add a single email via dedicated extension endpoint ───────────────────
async function addEmailToSheet(email) {
  const env = activeEnv;
  const token = await getSessionToken(env.api);
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${env.api}/sheet/add`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ email }),
  });

  if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
  if (res.status === 422) throw new Error("INVALID_EMAIL");
  if (!res.ok) throw new Error("UNKNOWN");

  const data = await res.json();
  if (data.added === false) throw new Error("DUPLICATE");
  return data;
}

// ─── open sidebar ──────────────────────────────────────────────────────────
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// ─── message handler ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_AUTH") {
    fetchMe()
      .then(({ user, env }) => sendResponse({ user, webUrl: env.web }))
      .catch(() => sendResponse({ user: null, webUrl: activeEnv.web }));
    return true; // keep port open for async response
  }

  if (msg.type === "LOGIN_SUCCESS") {
    // Close the side panel (it handles window.close() on CLOSE_PANEL)
    // then broadcast AUTH_CHANGED so it refreshes if the user re-opens it
    chrome.runtime.sendMessage({ type: "CLOSE_PANEL" }).catch(() => {});
    // Small delay so the panel has time to close before we update state
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "AUTH_CHANGED" }).catch(() => {});
    }, 300);
    sendResponse({ ok: true });
  }

  if (msg.type === "LOGOUT_SUCCESS") {
    // Close the panel immediately, then refresh auth state
    chrome.runtime.sendMessage({ type: "CLOSE_PANEL" }).catch(() => {});
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "AUTH_CHANGED" }).catch(() => {});
    }, 300);
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
    (async () => {
      const { env } = await fetchMe();
      const loginUrl = env.web; // no ?from=extension — tab stays open after login
      try {
        // If an existing JobPilot tab is already open, focus it
        const tabs = await chrome.tabs.query({
          url: [
            `${env.web}/*`,
            "http://localhost:5173/*",
            "http://127.0.0.1:5173/*",
            "https://jobpilot-1bc0e.firebaseapp.com/*",
            "https://jobpilot-1bc0e.web.app/*",
          ],
        });
        if (tabs && tabs.length > 0) {
          const targetTab = tabs[0];
          await chrome.tabs.update(targetTab.id, { active: true });
          if (targetTab.windowId) {
            await chrome.windows.update(targetTab.windowId, { focused: true });
          }
          return;
        }
      } catch {}
      chrome.tabs.create({ url: loginUrl });
    })();
    sendResponse({ ok: true });
  }

  if (msg.type === "OPEN_SHEET") {
    (async () => {
      const env = activeEnv;
      const sheetUrl = `${env.web}/sheet`;
      try {
        const tabs = await chrome.tabs.query({ url: [`${env.web}/sheet*`] });
        if (tabs && tabs.length > 0) {
          await chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId) {
            await chrome.windows.update(tabs[0].windowId, { focused: true });
          }
          return;
        }
      } catch {}
      chrome.tabs.create({ url: sheetUrl });
    })();
    sendResponse({ ok: true });
  }

  if (msg.type === "LOGOUT") {
    (async () => {
      const env = activeEnv;
      const token = await getSessionToken(env.api);
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${env.api}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      }).catch(() => {});
      sendResponse({ ok: true });
    })();
    return true;
  }
});
