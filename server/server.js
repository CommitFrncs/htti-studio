/* ═══════════════════════════════════════════════════════════
   HTTI Studio — server.js
   Node.js + Express backend
   - Verifies Firebase ID tokens
   - Proxies requests to htmlcsstoimage API
   - Rate limits per user
   - Never exposes API keys to frontend
   ═══════════════════════════════════════════════════════════ */

"use strict";

// ─────────────────────────────────────────────
// DEPENDENCIES
// ─────────────────────────────────────────────
const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");
const admin      = require("firebase-admin");
const fetch      = require("node-fetch");
require("dotenv").config();

// ─────────────────────────────────────────────
// ENVIRONMENT VARIABLES
// Required in .env file (see README):
//   HTTI_USER_ID          — htmlcsstoimage user ID
//   HTTI_API_KEY          — htmlcsstoimage API key
//   FIREBASE_SERVICE_ACCOUNT — JSON string of Firebase service account
//   ALLOWED_ORIGIN        — Frontend URL (e.g. https://yourdomain.netlify.app)
//   PORT                  — Server port (default 4000)
// ─────────────────────────────────────────────
const {
  HTTI_USER_ID,
  HTTI_API_KEY,
  FIREBASE_SERVICE_ACCOUNT,
  ALLOWED_ORIGIN,
  PORT = 4000
} = process.env;

// Validate required env vars on startup
const REQUIRED_VARS = ["HTTI_USER_ID", "HTTI_API_KEY", "FIREBASE_SERVICE_ACCOUNT"];
REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌  Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ─────────────────────────────────────────────
// FIREBASE ADMIN INIT
// ─────────────────────────────────────────────
let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
  console.error("❌  FIREBASE_SERVICE_ACCOUNT is not valid JSON:", err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ─────────────────────────────────────────────
// EXPRESS APP
// ─────────────────────────────────────────────
const app = express();

// ── Parse JSON bodies ──
app.use(express.json({ limit: "512kb" }));

// ── CORS — only allow your frontend domain ──
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  ALLOWED_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ── Security headers ──
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ─────────────────────────────────────────────
// RATE LIMITING
// Per-IP: 30 requests per 15 minutes (global guard)
// Per-user rate limit enforced in the route handler itself
// ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP. Please try again later." }
});

app.use("/generate", globalLimiter);

// Per-user rate limiting (in-memory, resets on server restart)
// For production, use Redis for persistence across instances
const userRequestMap = new Map();
const USER_RATE_LIMIT = { max: 5, windowMs: 60_000 };  // 5 per 60s

function checkUserRateLimit(uid) {
  const now = Date.now();
  const timestamps = (userRequestMap.get(uid) || []).filter(
    (t) => now - t < USER_RATE_LIMIT.windowMs
  );
  if (timestamps.length >= USER_RATE_LIMIT.max) {
    const retryAfter = Math.ceil(
      (USER_RATE_LIMIT.windowMs - (now - timestamps[0])) / 1000
    );
    return { allowed: false, retryAfter };
  }
  timestamps.push(now);
  userRequestMap.set(uid, timestamps);
  return { allowed: true };
}

// ─────────────────────────────────────────────
// MIDDLEWARE: Verify Firebase ID Token
// ─────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;   // { uid, email, name, ... }
    next();
  } catch (err) {
    console.warn("Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
}

// ─────────────────────────────────────────────
// INPUT VALIDATION HELPER
// ─────────────────────────────────────────────
function validateGenerateInput(body) {
  const {
    html, css,
    width, height, deviceScale, quality, bgColor, fileType
  } = body;

  const errors = [];

  if (!html || typeof html !== "string") {
    errors.push("html is required and must be a string.");
  } else if (html.length > 100_000) {
    errors.push("html is too large (max 100KB).");
  }

  if (css !== undefined && typeof css !== "string") {
    errors.push("css must be a string.");
  }
  if (css && css.length > 50_000) {
    errors.push("css is too large (max 50KB).");
  }

  if (width  && (isNaN(width)  || width  < 1 || width  > 3840)) errors.push("width must be 1–3840.");
  if (height && (isNaN(height) || height < 1 || height > 2160)) errors.push("height must be 1–2160.");
  if (deviceScale && ![1, 2, 3].includes(Number(deviceScale))) errors.push("deviceScale must be 1, 2, or 3.");
  if (quality && (isNaN(quality) || quality < 1 || quality > 100)) errors.push("quality must be 1–100.");
  if (fileType && !["png", "jpeg", "webp"].includes(fileType)) errors.push("fileType must be png, jpeg, or webp.");
  if (bgColor && !/^#[0-9A-Fa-f]{3,8}$/.test(bgColor)) errors.push("bgColor must be a valid hex color.");

  return errors;
}

// ═══════════════════════════════════════════════════════════
// ROUTE: POST /generate
// ═══════════════════════════════════════════════════════════

app.post("/generate", requireAuth, async (req, res) => {
  const { uid, email } = req.user;

  // Check per-user rate limit
  const rateCheck = checkUserRateLimit(uid);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter}s before generating again.`
    });
  }

  // Validate input
  const validationErrors = validateGenerateInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: "Validation failed: " + validationErrors.join(" | ")
    });
  }

  const {
    html,
    css          = "",
    width        = 800,
    height       = 600,
    deviceScale  = 2,
    quality      = 90,
    bgColor      = "#ffffff",
    fileType     = "png"
  } = req.body;

  console.log(`[${new Date().toISOString()}] Generate request — user: ${email}, size: ${width}×${height}, type: ${fileType}`);

  // ── Build the full HTML document to send to HTTI API ──
  // We wrap user HTML + CSS into a complete document
  const fullHtml = buildFullDocument(html, css, bgColor);

  // ── Build HTTI API request payload ──
  const httiPayload = {
    html:           fullHtml,
    viewport_width: Number(width),
    viewport_height:Number(height),
    device_scale:   Number(deviceScale),
    quality:        Number(quality),
    format:         fileType,        // "png" | "jpeg" | "webp"
    // Ensure transparent background is overridden by bgColor
    ...(fileType !== "png" ? {} : {})
  };

  try {
    // ── Call htmlcsstoimage API ──
    const httiResponse = await fetch("https://hcti.io/v1/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Basic auth with user_id:api_key
        "Authorization": "Basic " + Buffer.from(`${HTTI_USER_ID}:${HTTI_API_KEY}`).toString("base64")
      },
      body: JSON.stringify(httiPayload)
    });

    const httiData = await httiResponse.json();

    if (!httiResponse.ok) {
      console.error("HTTI API error:", httiResponse.status, httiData);
      return res.status(502).json({
        error: httiData?.error || `Image API error (${httiResponse.status}). Please try again.`
      });
    }

    if (!httiData.url) {
      return res.status(502).json({
        error: "Image API returned no URL. Please try again."
      });
    }

    // ── Return success ──
    return res.status(200).json({
      url:      httiData.url,
      width:    Number(width),
      height:   Number(height),
      fileType: fileType
    });

  } catch (err) {
    console.error("Unexpected error calling HTTI API:", err.message);
    return res.status(500).json({
      error: "Server error while generating image. Please try again."
    });
  }
});

// ─────────────────────────────────────────────
// Build a complete HTML document from user HTML + CSS
// Ensures styles apply correctly in the HTTI renderer
// ─────────────────────────────────────────────
function buildFullDocument(userHtml, userCss, bgColor) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: ${escapeHtml(bgColor)};
    width: 100%;
    height: 100%;
  }
  ${userCss}
</style>
</head>
<body>
  ${userHtml}
</body>
</html>`;
}

// Simple HTML escape for bgColor (prevent injection)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ═══════════════════════════════════════════════════════════
// ROUTE: GET /health
// ═══════════════════════════════════════════════════════════

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "HTTI Studio Backend",
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`✅  HTTI Studio backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
