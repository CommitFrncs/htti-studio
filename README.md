# HTTI Studio

**Convert HTML + CSS into images — instantly.**
A production-ready MVP web app built with plain HTML/CSS/JS, Node.js/Express, and Firebase.

---

## Project Structure

```
htti-studio/
├── client/               ← Frontend (deployed to Netlify)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json     ← PWA manifest
│   └── sw.js             ← Service worker
│
├── server/               ← Backend (deployed to Render or Railway)
│   ├── server.js
│   ├── package.json
│   └── .env.example      ← Copy to .env and fill in your values
│
├── netlify.toml          ← Netlify config
└── .gitignore
```

---

## Prerequisites

- Node.js v18+
- A [Firebase](https://firebase.google.com) project
- An [htmlcsstoimage](https://htmlcsstoimage.com) account (free tier available)
- A [Netlify](https://netlify.com) account
- A [Render](https://render.com) or [Railway](https://railway.app) account

---

## Step 1 — Firebase Setup

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `htti-studio`) → Continue
3. Disable Google Analytics if you don't need it → Create project

### 1.2 Enable Authentication

1. In the left sidebar, click **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable:
   - **Email/Password** → Enable → Save
   - **Google** → Enable → set Project support email → Save
   - **GitHub** → Enable → you'll need a GitHub OAuth App (see below)

#### Setting up GitHub OAuth

1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `HTTI Studio`
   - Homepage URL: `https://your-netlify-url.netlify.app`
   - Authorization callback URL: copy this from Firebase (shown when enabling GitHub sign-in)
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**
6. Paste both into the Firebase GitHub sign-in settings

### 1.3 Enable Firestore

1. In the sidebar, click **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** → select a region close to your users → Enable

### 1.4 Set Firestore Security Rules

1. In Firestore, click the **Rules** tab
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

### 1.5 Get Frontend Firebase Config

1. In Firebase Console, click the **gear icon → Project settings**
2. Scroll down to **Your apps** → click the **</>** (web) icon
3. Register the app with a nickname (e.g. `htti-web`)
4. Copy the `firebaseConfig` object
5. Open `client/app.js` and replace `FIREBASE_CONFIG` at the top:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abc123"
};
```

### 1.6 Get Backend Service Account Key

1. In Firebase Console → **Project settings → Service accounts**
2. Click **Generate new private key** → Download the JSON file
3. Convert to a single-line string for the env variable:

```bash
# On Mac/Linux:
cat your-service-account.json | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)))"

# Or using jq:
cat your-service-account.json | jq -c .
```

4. Keep this string — you'll need it in Step 3.

---

## Step 2 — htmlcsstoimage API

1. Sign up at [htmlcsstoimage.com](https://htmlcsstoimage.com)
2. Go to your [Dashboard](https://htmlcsstoimage.com/dashboard)
3. Copy your **User ID** and **API Key**
4. Keep these — you'll need them in Step 3.

---

## Step 3 — Backend Setup

### 3.1 Install Dependencies

```bash
cd server
npm install
```

### 3.2 Create .env File

```bash
cp .env.example .env
```

Open `.env` and fill in all values:

```env
HTTI_USER_ID=your_user_id_from_htti_dashboard
HTTI_API_KEY=your_api_key_from_htti_dashboard
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}   ← the single-line JSON from step 1.6
ALLOWED_ORIGIN=http://localhost:3000                        ← change this after deploying frontend
PORT=4000
```

### 3.3 Run Locally

```bash
npm run dev
# Server starts at http://localhost:4000
# Test it: http://localhost:4000/health
```

---

## Step 4 — Frontend Setup (Local)

Since it's plain HTML, you can open it directly or use any static server:

```bash
# Option 1: VS Code Live Server extension — open client/index.html → Go Live

# Option 2: Python
cd client
python3 -m http.server 3000
# Open http://localhost:3000

# Option 3: npx serve
npx serve client -p 3000
```

Open `client/app.js` and check:

```js
// This should point to your local backend during development
const BACKEND_URL = window.location.hostname === "localhost"
  ? "http://localhost:4000"
  : "https://YOUR-BACKEND-NAME.onrender.com";   // ← update after deploying backend
```

---

## Step 5 — Deploy Backend to Render

1. Push your project to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `htti-studio-server` (or any name)
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
5. Under **Environment**, add all variables from your `.env`:
   - `HTTI_USER_ID`
   - `HTTI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT`
   - `ALLOWED_ORIGIN` (temporarily set to `*`, update after Netlify deploy)
6. Click **Create Web Service**
7. Wait for deploy → copy your service URL (e.g. `https://htti-studio-server.onrender.com`)

**Update your frontend:**

```js
// In client/app.js, replace:
: "https://YOUR-BACKEND-NAME.onrender.com"
// With your actual Render URL
```

---

## Step 6 — Deploy Frontend to Netlify

### Option A: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=client --prod
```

### Option B: Netlify Dashboard

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
2. Connect your GitHub repo
3. Configure:
   - **Base directory**: *(leave empty — netlify.toml handles it)*
   - **Build command**: *(leave empty)*
   - **Publish directory**: `client`
4. Click **Deploy site**
5. Copy your Netlify URL (e.g. `https://htti-studio.netlify.app`)

**Update your backend CORS:**
- Go to Render → your service → Environment
- Update `ALLOWED_ORIGIN` to your Netlify URL
- Redeploy

**Update Firebase Authorized Domains:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your Netlify URL

---

## Step 7 — PWA Icons (Optional)

For the PWA install prompt to work fully, create two icon files:

```
client/icons/icon-192.png   (192×192 pixels)
client/icons/icon-512.png   (512×512 pixels)
```

You can use any image editor or an online tool like [favicon.io](https://favicon.io).

---

## How It Works

```
User opens app
    ↓
Firebase Auth (email / Google / GitHub)
    ↓
User types HTML + CSS, sets image settings
    ↓
Click "Generate Image"
    ↓
Frontend: get Firebase ID token
    ↓
POST /generate → Express backend (with Authorization: Bearer <token>)
    ↓
Backend: verify token with Firebase Admin SDK
    ↓
Backend: check per-user rate limit
    ↓
Backend: call htmlcsstoimage API (with secret API key)
    ↓
HTTI API returns image URL
    ↓
Backend returns URL to frontend
    ↓
Frontend displays image + download button
    ↓
Firestore: save generation to user's history
```

---

## Security Notes

- The htmlcsstoimage API key **never leaves the backend**. The frontend only receives image URLs.
- Every request is authenticated with a short-lived Firebase ID token (1 hour TTL).
- Rate limiting is enforced both client-side (UX) and server-side (security).
- CORS is locked to your specific frontend domain.
- Firestore rules prevent any user from reading another user's data.

---

## Firestore Data Structure

```
users/
  {userId}/
    settings/
      prefs/               ← user settings document
        width: 800
        height: 600
        deviceScale: 2
        quality: 90
        bgColor: "#ffffff"
        fileType: "png"
        lastHtml: "..."
        lastCss: "..."
    history/
      {docId}/             ← one document per generated image
        imageUrl: "https://hcti.io/v1/image/..."
        html: "..."
        css: "..."
        width: 800
        height: 600
        fileType: "png"
        createdAt: Timestamp
```

---

## Common Issues

**"CORS error" in browser console**
→ Make sure `ALLOWED_ORIGIN` in your backend `.env` exactly matches your frontend URL (no trailing slash).

**"Unauthorized: Invalid or expired token"**
→ Firebase project config mismatch between frontend and backend. Double-check `projectId`.

**Images not loading after generation**
→ Add `https://hcti.io` to your Netlify CSP headers (already done in `netlify.toml`).

**GitHub sign-in popup blocked**
→ User needs to allow popups for your domain. Or switch to redirect-based auth (change `signInWithPopup` to `signInWithRedirect`).

**Render backend goes to sleep (free tier)**
→ Free Render instances sleep after 15 minutes of inactivity. First request after sleep takes ~30s. Upgrade to paid or use Railway which has better free tier cold starts.

---

## Local Development Quick Start

```bash
# Terminal 1 — Backend
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev

# Terminal 2 — Frontend
cd client
npx serve . -p 3000    # or use VS Code Live Server
```

Open: `http://localhost:3000`
