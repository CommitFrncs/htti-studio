/* ═══════════════════════════════════════════════════════════
   HTTI Studio — app.js (v4)
   Vanilla JS | Firebase Auth + Firestore | Netlify Functions
   ═══════════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────
// FIREBASE CONFIG — paste your real values here
// ─────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC7OI7zrumGw9zbzluDgUzDcAdQpQO_IUk",
  authDomain:        "htti-studio.firebaseapp.com",
  projectId:         "htti-studio",
  storageBucket:     "htti-studio.firebasestorage.app",
  messagingSenderId: "104223911609",
  appId:             "1:104223911609:web:0e07d41e3896c1084a7568"
};

// ─────────────────────────────────────────────
// BACKEND — Netlify Function endpoint
// ─────────────────────────────────────────────
const BACKEND_URL = "/.netlify/functions";

// ─────────────────────────────────────────────
// RATE LIMIT (client-side)
// ─────────────────────────────────────────────
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

// ─────────────────────────────────────────────
// DEMO PRELOAD — shown on first login
// A dev-themed card demonstrating the tool
// ─────────────────────────────────────────────
const DEMO_HTML = `<div class="card">
  <div class="card-top">
    <div class="card-icon">⚡</div>
    <div class="card-tag">HTTI STUDIO</div>
  </div>
  <h1 class="card-title">Turn code<br/>into images.</h1>
  <p class="card-desc">Paste HTML + CSS.<br/>Get a pixel-perfect image.</p>
  <div class="card-footer">
    <span class="card-label">htmlcsstoimage API</span>
    <span class="card-arrow">→</span>
  </div>
</div>`;

const DEMO_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0A0A0A;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Syne', sans-serif;
  padding: 32px;
}

.card {
  background: #111111;
  border: 1px solid #2A2A2A;
  border-radius: 16px;
  padding: 36px;
  max-width: 400px;
  width: 100%;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.card-icon {
  font-size: 28px;
  line-height: 1;
}

.card-tag {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #D4F53C;
  background: rgba(212,245,60,0.1);
  border: 1px solid rgba(212,245,60,0.2);
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'DM Mono', monospace;
}

.card-title {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #F0F0F0;
  margin-bottom: 16px;
}

.card-desc {
  font-size: 15px;
  color: #888;
  line-height: 1.7;
  font-family: 'DM Mono', monospace;
  margin-bottom: 32px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #1E1E1E;
}

.card-label {
  font-size: 11px;
  color: #505050;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.04em;
}

.card-arrow {
  font-size: 20px;
  color: #D4F53C;
}`;

// ─────────────────────────────────────────────
// DEFAULT SETTINGS
// ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  width:       800,
  height:      600,
  deviceScale: 2,
  quality:     90,
  bgColor:     "#ffffff",
  fileType:    "png",
  lastHtml:    "",
  lastCss:     ""
};

// ═══════════════════════════════════════════════════════════
// FIREBASE INIT
// ═══════════════════════════════════════════════════════════

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();

const userDocRef    = (uid) => db.collection("users").doc(uid).collection("settings").doc("prefs");
const historyColRef = (uid) => db.collection("users").doc(uid).collection("history");

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

let currentUser       = null;
let userSettings      = { ...DEFAULT_SETTINGS };
let saveDebounceTimer = null;
let codeDebounceTimer = null;
let requestTimestamps = [];
let settingsOpen      = false;
let historyOpen       = false;
let activeTab         = "html";

// ═══════════════════════════════════════════════════════════
// DOM — APP
// ═══════════════════════════════════════════════════════════

const userAvatarBtn      = document.getElementById("user-avatar-btn");
const userAvatarInitials = document.getElementById("user-avatar-initials");
const userDropdown       = document.getElementById("user-dropdown");
const dropdownName       = document.getElementById("dropdown-display-name");
const dropdownEmail      = document.getElementById("dropdown-email");
const logoutBtn          = document.getElementById("logout-btn");
const historyToggleBtn   = document.getElementById("history-toggle-btn");
const settingsToggleBtn  = document.getElementById("settings-toggle-btn");

// Tabs
const tabs       = document.querySelectorAll(".tab");
const panelHtml  = document.getElementById("panel-html");
const panelCss   = document.getElementById("panel-css");
const panelPreview = document.getElementById("panel-preview");

// Editors
const htmlInput   = document.getElementById("html-input");
const cssInput    = document.getElementById("css-input");
const clearHtmlBtn= document.getElementById("clear-html-btn");
const clearCssBtn = document.getElementById("clear-css-btn");

// Preview states
const previewEmpty   = document.getElementById("preview-empty");
const previewLoading = document.getElementById("preview-loading");
const previewResult  = document.getElementById("preview-result");
const previewError   = document.getElementById("preview-error");
const outputImage    = document.getElementById("output-image");
const outputMeta     = document.getElementById("output-meta");
const downloadBtn    = document.getElementById("download-btn");
const copyUrlBtn     = document.getElementById("copy-url-btn");
const errorMessage   = document.getElementById("error-message");
const retryBtn       = document.getElementById("retry-btn");

// Generate
const generateBtn    = document.getElementById("generate-btn");
const generateLabel  = document.getElementById("generate-label");
const generateSpinner= document.getElementById("generate-spinner");

// Settings drawer
const settingsPanel  = document.getElementById("settings-panel");
const settingsOverlay= document.getElementById("settings-overlay");
const settingsCloseBtn = document.getElementById("settings-close-btn");
const sWidth         = document.getElementById("s-width");
const sHeight        = document.getElementById("s-height");
const sScale         = document.getElementById("s-scale");
const sQuality       = document.getElementById("s-quality");
const sBg            = document.getElementById("s-bg");
const sBgPicker      = document.getElementById("s-bg-picker");
const sFormat        = document.getElementById("s-format");
const formatRadios   = document.querySelectorAll('input[name="format"]');

// History drawer
const historyPanel   = document.getElementById("history-panel");
const historyOverlay = document.getElementById("history-overlay");
const historyCloseBtn= document.getElementById("history-close-btn");
const historyList    = document.getElementById("history-list");

// Toast
const toast = document.getElementById("toast");

// ═══════════════════════════════════════════════════════════
// FIREBASE AUTH STATE
// ═══════════════════════════════════════════════════════════

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await onUserLogin(user);
  } else {
    window.location.replace("auth.html");
  }
});

// ─────────────────────────────────────────────
async function onUserLogin(user) {
  userAvatarInitials.textContent = getInitials(user.displayName || user.email);
  dropdownName.textContent  = user.displayName || "User";
  dropdownEmail.textContent = user.email || "—";

  await loadSettings(user.uid);
}

// ═══════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════

logoutBtn.addEventListener("click", async () => {
  closeDropdown();
  await auth.signOut();
  userSettings = { ...DEFAULT_SETTINGS };
  htmlInput.value = "";
  cssInput.value  = "";
  showPreviewState("empty");
  historyList.innerHTML = '<p class="empty-state">No images yet.<br/>History shows here after you generate.</p>';
});

// ═══════════════════════════════════════════════════════════
// SETTINGS — LOAD FROM FIRESTORE
// ═══════════════════════════════════════════════════════════

async function loadSettings(uid) {
  try {
    const snap = await userDocRef(uid).get();
    userSettings = snap.exists
      ? { ...DEFAULT_SETTINGS, ...snap.data() }
      : { ...DEFAULT_SETTINGS };
  } catch {
    userSettings = { ...DEFAULT_SETTINGS };
  }
  applySettingsToUI();
}

function applySettingsToUI() {
  sWidth.value    = userSettings.width;
  sHeight.value   = userSettings.height;
  sScale.value    = userSettings.deviceScale;
  sQuality.value  = userSettings.quality;
  sBg.value       = userSettings.bgColor;
  sBgPicker.value = userSettings.bgColor;
  sFormat.value   = userSettings.fileType;

  // Sync radio buttons
  formatRadios.forEach(r => { r.checked = r.value === userSettings.fileType; });

  // Load last used code, or demo if first time
  if (userSettings.lastHtml) {
    htmlInput.value = userSettings.lastHtml;
    cssInput.value  = userSettings.lastCss || "";
  } else {
    // First login — load demo code
    htmlInput.value = DEMO_HTML;
    cssInput.value  = DEMO_CSS;
  }
}

// ═══════════════════════════════════════════════════════════
// SETTINGS — SAVE TO FIRESTORE
// ═══════════════════════════════════════════════════════════

function saveSettings() {
  if (!currentUser) return;
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    try {
      await userDocRef(currentUser.uid).set(userSettings, { merge: true });
    } catch (err) {
      console.warn("Settings save failed:", err.message);
    }
  }, 800);
}

function onSettingsChange() {
  userSettings.width       = parseInt(sWidth.value, 10)   || 800;
  userSettings.height      = parseInt(sHeight.value, 10)  || 600;
  userSettings.deviceScale = parseInt(sScale.value, 10)   || 2;
  userSettings.quality     = parseInt(sQuality.value, 10) || 90;
  userSettings.bgColor     = sBg.value || "#ffffff";
  userSettings.fileType    = sFormat.value || "png";
  saveSettings();
}

[sWidth, sHeight, sQuality, sBg, sScale, sFormat].forEach(el => {
  if (el) {
    el.addEventListener("change", onSettingsChange);
    el.addEventListener("input",  onSettingsChange);
  }
});

// Color picker sync
sBgPicker.addEventListener("input", () => { sBg.value = sBgPicker.value; onSettingsChange(); });
sBg.addEventListener("input", () => {
  if (/^#[0-9A-Fa-f]{6}$/.test(sBg.value)) sBgPicker.value = sBg.value;
  onSettingsChange();
});

// Format radio buttons
formatRadios.forEach(r => {
  r.addEventListener("change", () => {
    sFormat.value = r.value;
    onSettingsChange();
  });
});

// ═══════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchTab(tab.dataset.tab);
  });
});

function switchTab(name) {
  activeTab = name;

  // Update tab bar
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));

  // Show correct panel
  [panelHtml, panelCss, panelPreview].forEach(p => p.classList.remove("active"));
  if (name === "html")    panelHtml.classList.add("active");
  if (name === "css")     panelCss.classList.add("active");
  if (name === "preview") panelPreview.classList.add("active");
}

// ═══════════════════════════════════════════════════════════
// GENERATE IMAGE
// ═══════════════════════════════════════════════════════════

generateBtn.addEventListener("click", handleGenerate);
retryBtn.addEventListener("click", handleGenerate);

async function handleGenerate() {
  if (!currentUser) return;

  const html = htmlInput.value.trim();
  const css  = cssInput.value.trim();

  if (!html) {
    showToast("HTML is empty. Add some HTML first.", "error");
    switchTab("html");
    return;
  }

  // Client-side rate limit
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT.windowMs);
  if (requestTimestamps.length >= RATE_LIMIT.max) {
    const wait = Math.ceil((RATE_LIMIT.windowMs - (now - requestTimestamps[0])) / 1000);
    showToast(`Rate limit. Wait ${wait}s.`, "error");
    return;
  }

  // Save code
  userSettings.lastHtml = html;
  userSettings.lastCss  = css;
  saveSettings();

  // Switch to preview tab to show loading
  switchTab("preview");
  showPreviewState("loading");
  setGenerating(true);

  try {
    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        html,
        css,
        width:       userSettings.width,
        height:      userSettings.height,
        deviceScale: userSettings.deviceScale,
        quality:     userSettings.quality,
        bgColor:     userSettings.bgColor,
        fileType:    userSettings.fileType
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || `Error ${response.status}`);

    requestTimestamps.push(Date.now());

    // Show result
    displayResult(data.url, data.width, data.height, data.fileType);

    // Save history
    await saveToHistory({
      imageUrl:  data.url,
      html,
      css,
      width:     data.width    || userSettings.width,
      height:    data.height   || userSettings.height,
      fileType:  data.fileType || userSettings.fileType,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast("Image generated!", "success");

  } catch (err) {
    showPreviewState("error", err.message || "Something went wrong.");
  } finally {
    setGenerating(false);
  }
}

// ─────────────────────────────────────────────
function displayResult(url, width, height, fileType) {
  outputImage.src = url;
  const filename  = `htti-${Date.now()}.${fileType || "png"}`;
  downloadBtn.href     = url;
  downloadBtn.download = filename;
  outputMeta.textContent = `${width || "?"}×${height || "?"} · ${(fileType || "PNG").toUpperCase()}`;
  showPreviewState("result");
}

// ─────────────────────────────────────────────
// Show one of: empty | loading | result | error
// ─────────────────────────────────────────────
function showPreviewState(state, message = "") {
  previewEmpty.classList.add("hidden");
  previewLoading.classList.add("hidden");
  previewResult.classList.add("hidden");
  previewError.classList.add("hidden");

  if (state === "empty")   previewEmpty.classList.remove("hidden");
  if (state === "loading") previewLoading.classList.remove("hidden");
  if (state === "result")  previewResult.classList.remove("hidden");
  if (state === "error") {
    previewError.classList.remove("hidden");
    errorMessage.textContent = message || "Something went wrong.";
  }
}

// ─────────────────────────────────────────────
function setGenerating(loading) {
  generateBtn.disabled = loading;
  if (loading) {
    generateLabel.classList.add("hidden");
    generateSpinner.classList.remove("hidden");
  } else {
    generateLabel.classList.remove("hidden");
    generateSpinner.classList.add("hidden");
  }
}

// ═══════════════════════════════════════════════════════════
// COPY URL
// ═══════════════════════════════════════════════════════════

copyUrlBtn.addEventListener("click", () => {
  const url = outputImage.src;
  if (!url) return;
  navigator.clipboard.writeText(url)
    .then(() => showToast("URL copied!", "success"))
    .catch(() => {
      const i = document.createElement("input");
      i.value = url;
      document.body.appendChild(i);
      i.select();
      document.execCommand("copy");
      document.body.removeChild(i);
      showToast("URL copied!", "success");
    });
});

// ═══════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════

async function saveToHistory(entry) {
  if (!currentUser) return;
  try {
    await historyColRef(currentUser.uid).add(entry);
  } catch (err) {
    console.warn("History save failed:", err.message);
  }
}

async function loadHistory() {
  if (!currentUser) return;
  historyList.innerHTML = '<p class="empty-state">Loading…</p>';
  try {
    const snap = await historyColRef(currentUser.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    if (snap.empty) {
      historyList.innerHTML = '<p class="empty-state">No images yet.<br/>History shows here after you generate.</p>';
      return;
    }
    historyList.innerHTML = "";
    snap.forEach(doc => historyList.appendChild(buildHistoryItem(doc.data())));
  } catch (err) {
    historyList.innerHTML = `<p class="empty-state" style="color:var(--danger)">Failed to load: ${err.message}</p>`;
  }
}

function buildHistoryItem(data) {
  const wrap  = document.createElement("div");
  wrap.className = "history-item";
  const thumb = document.createElement("img");
  thumb.className = "history-thumb";
  thumb.src     = data.imageUrl || "";
  thumb.alt     = "Generated image";
  thumb.loading = "lazy";
  const meta  = document.createElement("div");
  meta.className = "history-meta";
  const date  = data.createdAt?.toDate?.()
    ? data.createdAt.toDate().toLocaleString() : "Recent";
  meta.innerHTML = `
    <span class="history-date">${date}</span>
    <span class="history-dims">${data.width || "?"}×${data.height || "?"} · ${(data.fileType || "png").toUpperCase()}</span>
    <button class="history-load-btn">↩ Reload design</button>
  `;
  meta.querySelector(".history-load-btn").addEventListener("click", () => {
    if (data.html) htmlInput.value = data.html;
    if (data.css)  cssInput.value  = data.css;
    closeHistory();
    switchTab("html");
    showToast("Design loaded", "success");
  });
  wrap.appendChild(thumb);
  wrap.appendChild(meta);
  return wrap;
}

// ═══════════════════════════════════════════════════════════
// DRAWERS — SETTINGS
// ═══════════════════════════════════════════════════════════

settingsToggleBtn.addEventListener("click", () => {
  settingsOpen ? closeSettings() : openSettings();
});
settingsCloseBtn.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", closeSettings);

function openSettings() {
  closeHistory();
  settingsPanel.classList.remove("hidden");
  settingsOverlay.classList.remove("hidden");
  settingsToggleBtn.classList.add("active");
  settingsOpen = true;
}

function closeSettings() {
  settingsPanel.classList.add("hidden");
  settingsOverlay.classList.add("hidden");
  settingsToggleBtn.classList.remove("active");
  settingsOpen = false;
}

// ─────────────────────────────────────────────
// DRAWERS — HISTORY
// ─────────────────────────────────────────────

historyToggleBtn.addEventListener("click", () => {
  historyOpen ? closeHistory() : openHistory();
});
historyCloseBtn.addEventListener("click", closeHistory);
historyOverlay.addEventListener("click", closeHistory);

function openHistory() {
  closeSettings();
  historyPanel.classList.remove("hidden");
  historyOverlay.classList.remove("hidden");
  historyToggleBtn.classList.add("active");
  historyOpen = true;
  loadHistory();
}

function closeHistory() {
  historyPanel.classList.add("hidden");
  historyOverlay.classList.add("hidden");
  historyToggleBtn.classList.remove("active");
  historyOpen = false;
}

// ═══════════════════════════════════════════════════════════
// USER DROPDOWN
// ═══════════════════════════════════════════════════════════

userAvatarBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!userAvatarBtn.contains(e.target)) closeDropdown();
});

function closeDropdown() {
  userDropdown.classList.add("hidden");
}

// ═══════════════════════════════════════════════════════════
// EDITOR CLEAR
// ═══════════════════════════════════════════════════════════

clearHtmlBtn.addEventListener("click", () => { htmlInput.value = ""; htmlInput.focus(); });
clearCssBtn.addEventListener("click",  () => { cssInput.value  = ""; cssInput.focus();  });

// Auto-save code changes (debounced)
htmlInput.addEventListener("input", () => {
  clearTimeout(codeDebounceTimer);
  codeDebounceTimer = setTimeout(() => {
    userSettings.lastHtml = htmlInput.value;
    userSettings.lastCss  = cssInput.value;
    saveSettings();
  }, 1500);
});

cssInput.addEventListener("input", () => {
  clearTimeout(codeDebounceTimer);
  codeDebounceTimer = setTimeout(() => {
    userSettings.lastHtml = htmlInput.value;
    userSettings.lastCss  = cssInput.value;
    saveSettings();
  }, 1500);
});

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════

let toastTimer = null;
function showToast(message, type = "") {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function getInitials(str) {
  if (!str) return "?";
  const parts = str.trim().split(/[\s@]+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// SERVICE WORKER
// ═══════════════════════════════════════════════════════════

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("SW registered:", reg.scope))
      .catch(err => console.warn("SW failed:", err));
  });
}
