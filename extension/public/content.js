/* ===================================================================
   JobPilot – content script
   Detects email text selection on ANY page / iframe and shows a
   compact floating toolbar anchored to the selection, similar to
   the browser's built-in copy toolbar.
   =================================================================== */

const EMAIL_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/;

let tooltip = null;
let hideTimer = null;

// ─── icons ─────────────────────────────────────────────────────────
const LOGO = `
  <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
    <rect class="jp-logo-bg" width="64" height="64" rx="16"/>
    <path class="jp-logo-dots" d="M11 50 C15 44 19 42 24 40" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 5" opacity="0.7"/>
    <path class="jp-logo-fg" d="M49 15 L14 29 L27 36 L34 50 Z" stroke-linejoin="round"/>
    <path class="jp-logo-line" d="M27 36 L49 15" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

const MAIL_ICON = `
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" aria-hidden="true">
    <path d="M1.5 2A1.5 1.5 0 000 3.5v.382l8 4.77 8-4.77V3.5A1.5 1.5 0 0014.5 2h-13zm13 3.45L8 10.154 1.5 5.45V12.5A1.5 1.5 0 003 14h10a1.5 1.5 0 001.5-1.5V5.45z"/>
  </svg>`;

const PLUS_ICON = `
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" aria-hidden="true">
    <path d="M8 1.5a.5.5 0 01.5.5v5.5H14a.5.5 0 010 1H8.5V14a.5.5 0 01-1 0V8.5H2a.5.5 0 010-1h5.5V2a.5.5 0 01.5-.5z"/>
  </svg>`;

const CHECK_ICON = `
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" aria-hidden="true">
    <path d="M13.485 1.431a1.473 1.473 0 00-2.084 0l-6.477 6.477-2.308-2.308a1.473 1.473 0 00-2.083 2.083l3.35 3.35a1.473 1.473 0 002.083 0l7.519-7.519a1.473 1.473 0 000-2.083z"/>
  </svg>`;

const GOOGLE_G = `
  <svg viewBox="0 0 48 48" width="14" height="14" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;


// ─── remove existing tooltip ───────────────────────────────────────
function removeTooltip() {
  if (tooltip) { tooltip.remove(); tooltip = null; }
  clearHideTimer();
}

function clearHideTimer() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
}

// ─── build tooltip anchored to selection (fixed positioning) ───────
function buildTooltip(email, viewportRect) {
  removeTooltip();

  const el = document.createElement("div");
  el.id = "jp-tooltip";
  el.setAttribute("data-jp", "true");

  el.innerHTML = `
    <div class="jp-accent" aria-hidden="true"></div>
    <div class="jp-pill">
      <span class="jp-logo-wrap" aria-hidden="true">${LOGO}</span>

      <span class="jp-email-chip">
        ${MAIL_ICON}
        <span class="jp-email-text" title="${email}">${email}</span>
      </span>

      <button class="jp-btn-add" id="jp-btn-add" title="Add to your JobPilot sheet">
        ${PLUS_ICON} Add
      </button>
    </div>
    <div class="jp-status-bar" id="jp-status-bar" role="status" aria-live="polite"></div>
  `;

  // ── Position: fixed, below selection, nudged to stay on screen ──
  const TIP_W = 380;
  const TIP_H = 56;
  const GAP = 8;

  let left = viewportRect.left;
  let top = viewportRect.bottom + GAP;

  if (left + TIP_W > window.innerWidth - 8) left = window.innerWidth - TIP_W - 8;
  if (left < 8) left = 8;
  if (top + TIP_H > window.innerHeight - 8) top = viewportRect.top - TIP_H - GAP;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  el.addEventListener("mouseenter", clearHideTimer);
  el.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(removeTooltip, 500);
  });

  el.querySelector("#jp-btn-add").addEventListener("click", (e) => {
    e.stopPropagation();
    handleAdd(email, el);
  });

  document.body.appendChild(el);
  tooltip = el;

  hideTimer = setTimeout(removeTooltip, 9000);
}


// ─── status helpers ────────────────────────────────────────────────
function setBar(el, type, html) {
  const bar = el.querySelector("#jp-status-bar");
  if (!bar) return;
  bar.innerHTML = `<span class="jp-dot"></span><span>${html}</span>`;
  bar.className = `jp-status-bar jp-status-bar--${type} jp-status-bar--visible`;
}


function setBtnState(el, busy) {
  const btn = el.querySelector("#jp-btn-add");
  if (!btn) return;
  btn.disabled = busy;
  btn.innerHTML = busy
    ? `<span class="jp-spinner"></span> Adding…`
    : `${PLUS_ICON} Add`;
}

// ─── main flow ────────────────────────────────────────────────────
async function handleAdd(email, el) {
  setBtnState(el, true);

  try {
    const authRes = await chrome.runtime.sendMessage({ type: "CHECK_AUTH" });

    if (!authRes || !authRes.user) {
      setBtnState(el, false);
      swapToLogin(el);
      setBar(el, "warn", "Sign in to JobPilot to save emails");
      return;
    }

    const addRes = await chrome.runtime.sendMessage({ type: "ADD_EMAIL", email });

    if (addRes.ok) {
      const btn = el.querySelector("#jp-btn-add");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `${CHECK_ICON} Added`;
        btn.className = "jp-btn-add jp-btn-add--success";
      }
      setBar(el, "success",
        `<strong>${email}</strong> added to your sheet`
      );
      const bar = el.querySelector("#jp-status-bar");
      bar.insertAdjacentHTML("beforeend", `<button id="jp-open-sheet" class="jp-inline-link">View sheet</button>`);
      el.querySelector("#jp-open-sheet")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "OPEN_SHEET" });
      });
      setTimeout(removeTooltip, 4000);
    } else {
      setBtnState(el, false);
      if (addRes.error === "DUPLICATE") {
        setBar(el, "warn", `<strong>${email}</strong> is already in your sheet`);
      } else if (addRes.error === "NOT_AUTHENTICATED") {
        swapToLogin(el);
        setBar(el, "warn", "Session expired. Please sign in again");
      } else {
        setBar(el, "error", "Couldn't add. Check your connection and try again");
      }
    }
  } catch (err) {
    setBtnState(el, false);
    setBar(el, "error", "Extension error. Try reloading the page");
    console.error("[JobPilot]", err);
  }
}

function swapToLogin(el) {
  const btn = el.querySelector("#jp-btn-add");
  if (!btn) return;
  btn.outerHTML = `<button class="jp-btn-login" id="jp-btn-login">${GOOGLE_G} Sign in</button>`;
  el.querySelector("#jp-btn-login")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_LOGIN" });
  });
}


// ─── detect selection ──────────────────────────────────────────────
document.addEventListener("mouseup", (e) => {
  if (e.target?.closest?.("[data-jp]")) return;

  setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const match = sel.toString().match(EMAIL_RE);
    if (!match) return;

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    buildTooltip(match[1], rect);
  }, 60);
});

// ─── hide on outside click ─────────────────────────────────────────
document.addEventListener("mousedown", (e) => {
  if (tooltip && !e.target?.closest?.("[data-jp]")) {
    hideTimer = setTimeout(removeTooltip, 120);
  }
});
// ─── hide on key / scroll / resize ────────────────────────────────
document.addEventListener("keydown", removeTooltip, { capture: true });
window.addEventListener("scroll", removeTooltip, { passive: true });
window.addEventListener("resize", removeTooltip, { passive: true });

const JOBPILOT_ORIGINS = ["http://localhost:5173", "https://jobpilot-1bc0e.firebaseapp.com"]; // keep in sync with prod URL

window.addEventListener("message", (e) => {
  if (e.source !== window) return;
  if (!JOBPILOT_ORIGINS.includes(window.location.origin)) return;
  if (e.data?.source !== "jobpilot-web" || e.data?.type !== "LOGIN_SUCCESS") return;
  chrome.runtime.sendMessage({ type: "LOGIN_SUCCESS" });
});
