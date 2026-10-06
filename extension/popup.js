/* popup.js – logic for the toolbar popup */

const JOBPILOT_URL = "http://localhost:5173"; // swap to prod URL

// ─── helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

function setStatus(msg, type = "") {
  const el = $("add-status");
  el.textContent = msg;
  el.className = "status-msg" + (type ? ` status-${type}` : "");
}

// ─── render logged-in state ────────────────────────────────────────────────
function renderUser(user) {
  hide("view-loading");
  hide("view-loggedout");
  show("view-loggedin");

  $("user-name").textContent = user.name ?? "Signed in";
  $("user-email").textContent = user.email;

  const avatarEl = $("user-avatar");
  const fallbackEl = $("user-fallback");

  if (user.picture) {
    avatarEl.src = user.picture;
    avatarEl.onerror = () => {
      hide("user-avatar");
      fallbackEl.textContent = (user.name ?? user.email).slice(0, 2).toUpperCase();
      show("user-fallback");
    };
    show("user-avatar");
    hide("user-fallback");
  } else {
    fallbackEl.textContent = (user.name ?? user.email).slice(0, 2).toUpperCase();
    show("user-fallback");
    hide("user-avatar");
  }

  $("btn-logout").style.display = "inline";
  $("footer-privacy").style.display = "inline";
}

function renderLoggedOut() {
  hide("view-loading");
  hide("view-loggedin");
  show("view-loggedout");
  $("btn-logout").style.display = "none";
  $("footer-privacy").style.display = "inline";
}

// ─── init ──────────────────────────────────────────────────────────────────
async function init() {
  show("view-loading");

  const res = await chrome.runtime.sendMessage({ type: "CHECK_AUTH" });
  if (res.user) {
    renderUser(res.user);
  } else {
    renderLoggedOut();
  }
}

// ─── add email (manual) ────────────────────────────────────────────────────
async function handleAdd() {
  const email = $("manual-email").value.trim();
  if (!email) { setStatus("Enter an email address", "warn"); return; }
  if (!EMAIL_RE.test(email)) { setStatus("That doesn't look like a valid email", "error"); return; }

  $("btn-add").disabled = true;
  $("btn-add").textContent = "…";
  setStatus("");

  const res = await chrome.runtime.sendMessage({ type: "ADD_EMAIL", email });

  $("btn-add").disabled = false;
  $("btn-add").textContent = "Add";

  if (res.ok) {
    setStatus("✓ Added to your sheet!", "success");
    $("manual-email").value = "";
    setTimeout(() => setStatus(""), 3000);
  } else if (res.error === "DUPLICATE") {
    setStatus("⚠ Already in your sheet", "warn");
  } else if (res.error === "INVALID_EMAIL") {
    setStatus("✕ Invalid email address", "error");
  } else if (res.error === "NOT_AUTHENTICATED") {
    renderLoggedOut();
  } else {
    setStatus("✕ Couldn't add – please try again", "error");
  }
}

// ─── event listeners ───────────────────────────────────────────────────────
$("btn-login").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_LOGIN" });
  window.close();
});

$("btn-sheet").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_SHEET" });
  window.close();
});

$("btn-add").addEventListener("click", handleAdd);

$("manual-email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAdd();
});

$("btn-logout").addEventListener("click", async () => {
  await chrome.storage.local.remove(["jp_user", "jp_token"]);
  // Try to also call backend logout (best-effort, no await needed)
  fetch("http://localhost:8001/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  renderLoggedOut();
});

$("footer-jobpilot").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: JOBPILOT_URL });
  window.close();
});

// ─── start ─────────────────────────────────────────────────────────────────
init();
