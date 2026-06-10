/* ═══════════════════════════════════════════════════════════
   HTTI Studio — netlify/functions/generate.js
   Netlify Serverless Function (replaces Express server)
   - Verifies Firebase ID tokens
   - Proxies to htmlcsstoimage API
   - Rate limits per user (in-memory per instance)
   - API keys never exposed to frontend
   ═══════════════════════════════════════════════════════════ */

"use strict";

const admin = require("firebase-admin");
const fetch = require("node-fetch");

// ─────────────────────────────────────────────
// FIREBASE ADMIN — initialize once per instance
// The `if` check prevents re-initialization on
// warm function invocations (Netlify reuses instances)
// ─────────────────────────────────────────────
if (!admin.apps.length) {
  let serviceAccount;

  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON:", err.message);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// ─────────────────────────────────────────────
// PER-USER RATE LIMITING (in-memory)
// Resets when the function instance recycles.
// Good enough for MVP — upgrade to Redis later if needed.
// ─────────────────────────────────────────────
const userRequestMap = new Map();
const RATE_LIMIT = { max: 5, windowMs: 60_000 }; // 5 per minute

function checkUserRateLimit(uid) {
  const now = Date.now();
  const timestamps = (userRequestMap.get(uid) || []).filter(
    (t) => now - t < RATE_LIMIT.windowMs
  );
  if (timestamps.length >= RATE_LIMIT.max) {
    const retryAfter = Math.ceil(
      (RATE_LIMIT.windowMs - (now - timestamps[0])) / 1000
    );
    return { allowed: false, retryAfter };
  }
  timestamps.push(now);
  userRequestMap.set(uid, timestamps);
  return { allowed: true };
}

// ─────────────────────────────────────────────
// CORS HEADERS
// Since frontend and functions are on the same
// Netlify domain, we just allow same-origin + localhost
// ─────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

// ─────────────────────────────────────────────
// INPUT VALIDATION
// ─────────────────────────────────────────────
function validateInput(body) {
  const { html, css, width, height, deviceScale, quality, bgColor, fileType } = body;
  const errors = [];

  if (!html || typeof html !== "string")
    errors.push("html is required.");
  else if (html.length > 100_000)
    errors.push("html exceeds 100KB limit.");

  if (css && typeof css !== "string")
    errors.push("css must be a string.");
  if (css && css.length > 50_000)
    errors.push("css exceeds 50KB limit.");

  if (width  && (isNaN(width)  || width  < 1 || width  > 3840)) errors.push("width must be 1–3840.");
  if (height && (isNaN(height) || height < 1 || height > 2160)) errors.push("height must be 1–2160.");
  if (deviceScale && ![1, 2, 3].includes(Number(deviceScale)))  errors.push("deviceScale must be 1, 2, or 3.");
  if (quality && (isNaN(quality) || quality < 1 || quality > 100)) errors.push("quality must be 1–100.");
  if (fileType && !["png", "jpeg", "webp"].includes(fileType))  errors.push("fileType must be png, jpeg, or webp.");
  if (bgColor && !/^#[0-9A-Fa-f]{3,8}$/.test(bgColor))         errors.push("bgColor must be a valid hex color.");

  return errors;
}

// ─────────────────────────────────────────────
// BUILD FULL HTML DOCUMENT
// Wraps user HTML + CSS into a complete page
// for the HTTI renderer
// ─────────────────────────────────────────────
function buildDocument(userHtml, userCss, bgColor) {
  // Sanitize bgColor to prevent injection
  const safeBg = /^#[0-9A-Fa-f]{3,8}$/.test(bgColor) ? bgColor : "#ffffff";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${safeBg}; width: 100%; height: 100%; }
  ${userCss || ""}
</style>
</head>
<body>
  ${userHtml}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════

exports.handler = async (event, context) => {

  // Handle CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed." })
    };
  }

  // ── 1. Verify Firebase ID token ──
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Unauthorized: No token provided." })
    };
  }

  let decodedToken;
  try {
    const idToken = authHeader.split("Bearer ")[1];
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Unauthorized: Invalid or expired token." })
    };
  }

  const { uid, email } = decodedToken;

  // ── 2. Check rate limit ──
  const rateCheck = checkUserRateLimit(uid);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Rate limit reached. Please wait ${rateCheck.retryAfter}s before generating again.`
      })
    };
  }

  // ── 3. Parse + validate request body ──
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body." })
    };
  }

  const validationErrors = validateInput(body);
  if (validationErrors.length > 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Validation failed: " + validationErrors.join(" | ") })
    };
  }

  const {
    html,
    css         = "",
    width       = 800,
    height      = 600,
    deviceScale = 2,
    quality     = 90,
    bgColor     = "#ffffff",
    fileType    = "png"
  } = body;

  console.log(`[${new Date().toISOString()}] Generate — user: ${email} | ${width}×${height} | ${fileType}`);

  // ── 4. Call htmlcsstoimage API ──
  const fullHtml = buildDocument(html, css, bgColor);

  const httiPayload = {
    html:            fullHtml,
    viewport_width:  Number(width),
    viewport_height: Number(height),
    device_scale:    Number(deviceScale),
    quality:         Number(quality),
    format:          fileType
  };

  const httiCredentials = Buffer.from(
    `${process.env.HTTI_USER_ID}:${process.env.HTTI_API_KEY}`
  ).toString("base64");

  let httiData;
  try {
    const httiResponse = await fetch("https://hcti.io/v1/image", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${httiCredentials}`
      },
      body: JSON.stringify(httiPayload)
    });

    httiData = await httiResponse.json();

    if (!httiResponse.ok) {
      console.error("HTTI API error:", httiResponse.status, httiData);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: httiData?.error || `Image API error (${httiResponse.status}). Please try again.`
        })
      };
    }
  } catch (err) {
    console.error("Failed to reach HTTI API:", err.message);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Could not reach image API. Please try again." })
    };
  }

  if (!httiData.url) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Image API returned no URL. Please try again." })
    };
  }

  // ── 5. Return success ──
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      url:      httiData.url,
      width:    Number(width),
      height:   Number(height),
      fileType: fileType
    })
  };
};
