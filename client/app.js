/* ═══════════════════════════════════════════════════════════
   HTTI Studio — app.js
   Vanilla JS | Firebase Auth + Firestore | HTTI API via backend
   ═══════════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────
// 1. FIREBASE CONFIGURATION
//    Replace these values with your own Firebase project config.
//    Get them from: Firebase Console → Project Settings → Your apps
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
// 2. BACKEND URL
//    Change this to your Render/Railway backend URL in production.
//    For local development: http://localhost:4000
// ─────────────────────────────────────────────
// Netlify Functions are served from the same domain automatically.
// No need to change this — it works for both localhost and production.
const BACKEND_URL = "/.netlify/functions";

// ─────────────────────────────────────────────
// 3. RATE LIMIT (client-side guard)
//    5 generations per user per 60 seconds (backend also enforces this)
// ─────────────────────────────────────────────
const RATE_LIMIT = { max: 5, windowMs: 60_000 };

// ─────────────────────────────────────────────
// 4. DEFAULT USER SETTINGS
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

// Firestore settings path helper
const userDocRef = (uid) => db.collection("users").doc(uid).collection("settings").doc("prefs");
const historyColRef = (uid) => db.collection("users").doc(uid).collection("history");

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

let currentUser    = null;
let userSettings   = { ...DEFAULT_SETTINGS };
let saveDebounceTimer = null;
let requestTimestamps = [];   // for client-side rate limiting
let settingsPanelOpen = false;
let historyPanelOpen  = false;

// ═══════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════

// Screens
const authScreen = document.getElementById("auth-screen");
const appScreen  = document.getElementById("app-screen");

// Auth
const authCard       = document.getElementById("auth-card");
const authError      = document.getElementById("auth-error");
const authForm       = document.getElementById("auth-form");
const authTabs       = document.querySelectorAll(".auth-tab");
const nameGroup      = document.getElementById("name-group");
const authName       = document.getElementById("auth-name");
const authEmail      = document.getElementById("auth-email");
const authPassword   = document.getElementById("auth-password");
const authSubmitBtn  = document.getElementById("auth-submit-btn");
const authSubmitLabel= authSubmitBtn.querySelector(".btn-label");
const authSpinner    = authSubmitBtn.querySelector(".btn-spinner");
const googleBtn      = document.getElementById("google-btn");
const githubBtn      = document.getElementById("github-btn");

// Nav
const historyToggleBtn = document.getElementById("history-toggle-btn");
const settingsToggleBtn= document.getElementById("settings-toggle-btn");
const userAvatarBtn    = document.getElementById("user-avatar-btn");
const userAvatarInitials = document.getElementById("user-avatar-initials");
const userDropdown     = document.getElementById("user-dropdown");
const dropdownName     = document.getElementById("dropdown-display-name");
const dropdownEmail    = document.getElementById("dropdown-email");
const logoutBtn        = document.getElementById("logout-btn");

// Settings panel
const settingsPanel    = document.getElementById("settings-panel");
const settingsCloseBtn = document.getElementById("settings-close-btn");
const sWidth    = document.getElementById("s-width");
const sHeight   = document.getElementById("s-height");
const sScale    = document.getElementById("s-scale");
const sQuality  = document.getElementById("s-quality");
const sBg       = document.getElementById("s-bg");
const sBgPicker = document.getElementById("s-bg-picker");
const sFormat   = document.getElementById("s-format");

// History panel
const historyPanel    = document.getElementById("history-panel");
const historyCloseBtn = document.getElementById("history-close-btn");
const historyList     = document.getElementById("history-list");

// Workspace
const htmlInput     = document.getElementById("html-input");
const cssInput      = document.getElementById("css-input");
const clearHtmlBtn  = document.getElementById("clear-html-btn");
const clearCssBtn   = document.getElementById("clear-css-btn");
const generateBtn   = document.getElementById("generate-btn");
const generateLabel = document.getElementById("generate-label");
const generateSpinner = document.getElementById("generate-spinner");
const generateHint  = document.getElementById("generate-hint");
const outputSection = document.getElementById("output-section");
const downloadBtn   = document.getElementById("download-btn");
const copyUrlBtn    = document.getElementById("copy-url-btn");
const outputImage   = document.getElementById("output-image");
const outputMeta    = document.getElementById("output-meta");
const errorBanner   = document.getElementById("error-banner");

// Toast
const toast = document.getElementById("toast");

// ═══════════════════════════════════════════════════════════
// AUTH STATE LISTENER
// ═══════════════════════════════════════════════════════════

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await onUserLogin(user);
  } else {
    currentUser = null;
    showScreen("auth");
  }
});

// Handle redirect result from Google/GitHub sign-in
auth.getRedirectResult().then((result) => {
  // result.user is null if no redirect happened — that's fine
}).catch((err) => {
  // Only show error if it's a real auth failure, not a config/init issue
  const ignoredCodes = ["auth/operation-not-supported-in-this-environment"];
  if (err.code && !ignoredCodes.includes(err.code)) {
    showAuthError("DEBUG: " + err.code);
  }
});
// ─────────────────────────────────────────────
// Called when user is authenticated
// ─────────────────────────────────────────────
async function onUserLogin(user) {
  // Update nav UI
  const initials = getInitials(user.displayName || user.email);
  userAvatarInitials.textContent = initials;
  dropdownName.textContent  = user.displayName || "User";
  dropdownEmail.textContent = user.email || "—";

  // Load settings from Firestore
  await loadSettings(user.uid);

  // Switch to app screen
  showScreen("app");
}

// ═══════════════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════════

function showScreen(name) {
  authScreen.classList.remove("active");
  appScreen.classList.remove("active");

  if (name === "auth") {
    authScreen.classList.add("active");
    authScreen.style.display = "flex";
    appScreen.style.display  = "none";
  } else {
    authScreen.style.display = "none";
    appScreen.style.display  = "block";
    appScreen.classList.add("active");
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH TABS
// ═══════════════════════════════════════════════════════════

let currentAuthMode = "login"; // "login" | "signup"

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    authTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentAuthMode = tab.dataset.tab;
    clearAuthError();

    if (currentAuthMode === "signup") {
      nameGroup.style.display = "flex";
      authSubmitLabel.textContent = "Create Account";
    } else {
      nameGroup.style.display = "none";
      authSubmitLabel.textContent = "Sign In";
    }
  });
});

// ═══════════════════════════════════════════════════════════
// EMAIL AUTH
// ═══════════════════════════════════════════════════════════

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthError();

  const email    = authEmail.value.trim();
  const password = authPassword.value;
  const name     = authName.value.trim();

  // Basic validation
  if (!email || !password) {
    showAuthError("Please fill in all fields.");
    return;
  }
  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  setAuthLoading(true);

  try {
    if (currentAuthMode === "signup") {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      // Set display name
      if (name) await cred.user.updateProfile({ displayName: name });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
    // onAuthStateChanged handles the rest
  } catch (err) {
    showAuthError(friendlyAuthError(err.code));
    setAuthLoading(false);
  }
});

// ═══════════════════════════════════════════════════════════
// OAUTH — GOOGLE
// ═══════════════════════════════════════════════════════════

googleBtn.addEventListener("click", async () => {
  clearAuthError();
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithRedirect(provider);
  } catch (err) {
    showAuthError(friendlyAuthError(err.code));
  }
});

// ═══════════════════════════════════════════════════════════
// OAUTH — GITHUB
// ═══════════════════════════════════════════════════════════

githubBtn.addEventListener("click", async () => {
  clearAuthError();
  const provider = new firebase.auth.GithubAuthProvider();
  try {
    await auth.signInWithRedirect(provider);
  } catch (err) {
    showAuthError(friendlyAuthError(err.code));
  }
});
// ═══════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════

logoutBtn.addEventListener("click", async () => {
  closeDropdown();
  await auth.signOut();
  // Reset state
  userSettings = { ...DEFAULT_SETTINGS };
  outputSection.classList.add("hidden");
  errorBanner.classList.add("hidden");
  historyList.innerHTML = '<p class="empty-state">No images generated yet.<br/>Your history will appear here.</p>';
});

// ═══════════════════════════════════════════════════════════
// USER SETTINGS — LOAD FROM FIRESTORE
// ═══════════════════════════════════════════════════════════

async function loadSettings(uid) {
  try {
    const snap = await userDocRef(uid).get();
    if (snap.exists) {
      // Merge with defaults (handles new fields added later)
      userSettings = { ...DEFAULT_SETTINGS, ...snap.data() };
    } else {
      userSettings = { ...DEFAULT_SETTINGS };
    }
  } catch (err) {
    console.warn("Could not load settings:", err.message);
    userSettings = { ...DEFAULT_SETTINGS };
  }

  // Apply to UI
  applySettingsToUI();
}

// ─────────────────────────────────────────────
// Populate settings form from userSettings state
// ─────────────────────────────────────────────
function applySettingsToUI() {
  sWidth.value    = userSettings.width;
  sHeight.value   = userSettings.height;
  sScale.value    = userSettings.deviceScale;
  sQuality.value  = userSettings.quality;
  sBg.value       = userSettings.bgColor;
  sBgPicker.value = userSettings.bgColor;
  sFormat.value   = userSettings.fileType;

  // Restore last used code
  if (userSettings.lastHtml) htmlInput.value = userSettings.lastHtml;
  if (userSettings.lastCss)  cssInput.value  = userSettings.lastCss;
}

// ═══════════════════════════════════════════════════════════
// USER SETTINGS — SAVE TO FIRESTORE (debounced)
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
  }, 800); // Save 800ms after last change
}

// ─────────────────────────────────────────────
// Listen for settings form changes
// ─────────────────────────────────────────────
function onSettingsChange() {
  userSettings.width       = parseInt(sWidth.value, 10)   || 800;
  userSettings.height      = parseInt(sHeight.value, 10)  || 600;
  userSettings.deviceScale = parseInt(sScale.value, 10)   || 2;
  userSettings.quality     = parseInt(sQuality.value, 10) || 90;
  userSettings.bgColor     = sBg.value || "#ffffff";
  userSettings.fileType    = sFormat.value || "png";
  saveSettings();
}

[sWidth, sHeight, sQuality, sBg, sScale, sFormat].forEach((el) => {
  el.addEventListener("change", onSettingsChange);
  el.addEventListener("input",  onSettingsChange);
});

// Sync color picker ↔ text field
sBgPicker.addEventListener("input", () => {
  sBg.value = sBgPicker.value;
  onSettingsChange();
});

sBg.addEventListener("input", () => {
  // Only update picker if it looks like a valid hex
  if (/^#[0-9A-Fa-f]{6}$/.test(sBg.value)) {
    sBgPicker.value = sBg.value;
  }
  onSettingsChange();
});

// ═══════════════════════════════════════════════════════════
// GENERATE IMAGE
// ═══════════════════════════════════════════════════════════

generateBtn.addEventListener("click", handleGenerate);

async function handleGenerate() {
  if (!currentUser) return;

  const html = htmlInput.value.trim();
  const css  = cssInput.value.trim();

  // Validate
  if (!html) {
    showError("HTML input is empty. Please add some HTML.");
    return;
  }

  // Client-side rate limit check
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_LIMIT.windowMs);
  if (requestTimestamps.length >= RATE_LIMIT.max) {
    const wait = Math.ceil((RATE_LIMIT.windowMs - (now - requestTimestamps[0])) / 1000);
    showError(`Rate limit reached. Please wait ${wait}s before generating again.`);
    return;
  }

  // Save current code to settings
  userSettings.lastHtml = html;
  userSettings.lastCss  = css;
  saveSettings();

  // Show loading state
  setGenerating(true);
  hideError();
  outputSection.classList.add("hidden");

  try {
    // Get a fresh Firebase ID token (sent to backend for auth verification)
    const idToken = await currentUser.getIdToken(/* forceRefresh */ true);

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

    if (!response.ok) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    // Record timestamp for rate limiting
    requestTimestamps.push(Date.now());

    // Show output
    displayOutput(data.url, data.width, data.height, data.fileType);

    // Save to Firestore history
    await saveToHistory({
      imageUrl:  data.url,
      html,
      css,
      width:     data.width    || userSettings.width,
      height:    data.height   || userSettings.height,
      fileType:  data.fileType || userSettings.fileType,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Refresh history panel if open
    if (historyPanelOpen) loadHistory();

    showToast("Image generated!", "success");

  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    setGenerating(false);
  }
}

// ─────────────────────────────────────────────
// Display the generated image in the output section
// ─────────────────────────────────────────────
function displayOutput(url, width, height, fileType) {
  outputImage.src = url;
  outputImage.onload = () => {
    outputSection.classList.remove("hidden");
  };
  outputImage.onerror = () => {
    showError("Image URL was returned but could not be loaded. Try downloading directly.");
    outputSection.classList.remove("hidden"); // still show download
  };

  // Set download link
  const filename = `htti-export-${Date.now()}.${fileType || "png"}`;
  downloadBtn.href     = url;
  downloadBtn.download = filename;
  downloadBtn.setAttribute("href", url);

  // Meta info
  outputMeta.textContent = `${width || "?"}×${height || "?"} px — ${(fileType || "png").toUpperCase()}`;
}

// ─────────────────────────────────────────────
// Copy image URL to clipboard
// ─────────────────────────────────────────────
copyUrlBtn.addEventListener("click", () => {
  const url = outputImage.src;
  if (!url || url === window.location.href) return;

  navigator.clipboard.writeText(url).then(() => {
    showToast("URL copied to clipboard!", "success");
  }).catch(() => {
    // Fallback for older browsers
    const input = document.createElement("input");
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    showToast("URL copied!", "success");
  });
});

// ═══════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════

// Save a generated image to Firestore history
async function saveToHistory(entry) {
  if (!currentUser) return;
  try {
    await historyColRef(currentUser.uid).add(entry);
  } catch (err) {
    console.warn("Could not save history:", err.message);
  }
}

// Load and render history from Firestore
async function loadHistory() {
  if (!currentUser) return;

  historyList.innerHTML = '<p class="empty-state">Loading history…</p>';

  try {
    const snap = await historyColRef(currentUser.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    if (snap.empty) {
      historyList.innerHTML = '<p class="empty-state">No images generated yet.<br/>Your history will appear here.</p>';
      return;
    }

    historyList.innerHTML = "";

    snap.forEach((doc) => {
      const d = doc.data();
      const el = buildHistoryItem(d);
      historyList.appendChild(el);
    });

  } catch (err) {
    historyList.innerHTML = `<p class="empty-state" style="color:var(--danger)">Could not load history: ${err.message}</p>`;
  }
}

// Build a single history card DOM element
function buildHistoryItem(data) {
  const wrap = document.createElement("div");
  wrap.className = "history-item";

  const thumb = document.createElement("img");
  thumb.className = "history-thumb";
  thumb.src     = data.imageUrl || "";
  thumb.alt     = "Generated image";
  thumb.loading = "lazy";

  const meta = document.createElement("div");
  meta.className = "history-meta";

  const date = data.createdAt?.toDate?.()
    ? data.createdAt.toDate().toLocaleString()
    : "Recent";

  meta.innerHTML = `
    <span class="history-date">${date}</span>
    <span class="history-dims">${data.width || "?"}×${data.height || "?"} · ${(data.fileType || "png").toUpperCase()}</span>
    <button class="history-load-btn">↩ Reload design</button>
  `;

  // Reload design on click
  meta.querySelector(".history-load-btn").addEventListener("click", () => {
    if (data.html) htmlInput.value = data.html;
    if (data.css)  cssInput.value  = data.css;
    closeHistoryPanel();
    showToast("Design loaded from history", "success");
    // Scroll to top of workspace
    document.getElementById("workspace").scrollIntoView({ behavior: "smooth" });
  });

  wrap.appendChild(thumb);
  wrap.appendChild(meta);
  return wrap;
}

// ═══════════════════════════════════════════════════════════
// PANEL TOGGLES
// ═══════════════════════════════════════════════════════════

// Settings panel
settingsToggleBtn.addEventListener("click", () => {
  if (settingsPanelOpen) {
    closeSettingsPanel();
  } else {
    closeHistoryPanel();
    openSettingsPanel();
  }
});

settingsCloseBtn.addEventListener("click", closeSettingsPanel);

function openSettingsPanel() {
  settingsPanel.classList.remove("hidden");
  settingsPanelOpen = true;
  settingsToggleBtn.classList.add("active");
}

function closeSettingsPanel() {
  settingsPanel.classList.add("hidden");
  settingsPanelOpen = false;
  settingsToggleBtn.classList.remove("active");
}

// History panel
historyToggleBtn.addEventListener("click", () => {
  if (historyPanelOpen) {
    closeHistoryPanel();
  } else {
    closeSettingsPanel();
    openHistoryPanel();
  }
});

historyCloseBtn.addEventListener("click", closeHistoryPanel);

function openHistoryPanel() {
  historyPanel.classList.remove("hidden");
  historyPanelOpen = true;
  historyToggleBtn.classList.add("active");
  loadHistory();
}

function closeHistoryPanel() {
  historyPanel.classList.add("hidden");
  historyPanelOpen = false;
  historyToggleBtn.classList.remove("active");
}

// ═══════════════════════════════════════════════════════════
// USER DROPDOWN
// ═══════════════════════════════════════════════════════════

userAvatarBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle("hidden");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
    closeDropdown();
  }
});

function closeDropdown() {
  userDropdown.classList.add("hidden");
}

// ═══════════════════════════════════════════════════════════
// EDITOR CLEAR BUTTONS
// ═══════════════════════════════════════════════════════════

clearHtmlBtn.addEventListener("click", () => {
  htmlInput.value = "";
  htmlInput.focus();
});

clearCssBtn.addEventListener("click", () => {
  cssInput.value = "";
  cssInput.focus();
});

// Auto-save code changes to settings (debounced)
let codeSaveTimer = null;
function debouncedCodeSave() {
  clearTimeout(codeSaveTimer);
  codeSaveTimer = setTimeout(() => {
    userSettings.lastHtml = htmlInput.value;
    userSettings.lastCss  = cssInput.value;
    saveSettings();
  }, 1500);
}

htmlInput.addEventListener("input", debouncedCodeSave);
cssInput.addEventListener("input", debouncedCodeSave);

// ═══════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════

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

function setAuthLoading(loading) {
  authSubmitBtn.disabled = loading;
  if (loading) {
    authSubmitLabel.classList.add("hidden");
    authSpinner.classList.remove("hidden");
  } else {
    authSubmitLabel.classList.remove("hidden");
    authSpinner.classList.add("hidden");
  }
}

// ═══════════════════════════════════════════════════════════
// ERROR / TOAST HELPERS
// ═══════════════════════════════════════════════════════════

function showError(message) {
  errorBanner.textContent = `⚠ ${message}`;
  errorBanner.classList.remove("hidden");
  errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
  errorBanner.classList.add("hidden");
  errorBanner.textContent = "";
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove("hidden");
}

function clearAuthError() {
  authError.classList.add("hidden");
  authError.textContent = "";
}

let toastTimer = null;
function showToast(message, type = "") {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

// Get 1–2 letter initials from a name or email
function getInitials(str) {
  if (!str) return "?";
  const parts = str.trim().split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

// Convert Firebase auth error codes to friendly messages
function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email":            "Please enter a valid email address.",
    "auth/user-not-found":           "No account found with this email.",
    "auth/wrong-password":           "Incorrect password. Please try again.",
    "auth/email-already-in-use":     "An account with this email already exists.",
    "auth/weak-password":            "Password should be at least 6 characters.",
    "auth/too-many-requests":        "Too many attempts. Please try again later.",
    "auth/network-request-failed":   "Network error. Check your connection.",
    "auth/popup-blocked":            "Popup was blocked. Please allow popups for this site.",
    "auth/account-exists-with-different-credential": "An account already exists with a different sign-in method."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ═══════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ═══════════════════════════════════════════════════════════

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("Service worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}
