<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0D0D0D,100:D4F53C&height=200&text=HTTI+Studio&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=HTML+%2B+CSS+→+Image.+Instantly.&descAlignY=62&descSize=18"/>
</div>

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=24&duration=4000&pause=1000&color=D4F53C&center=true&vCenter=true&width=600&lines=Convert+HTML+%2B+CSS+into+images;Built+with+Vanilla+JS+%2B+Firebase;Deployed+on+Netlify+%E2%80%94+Free+Forever" alt="Typing SVG" />
  </a>
</p>

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-htti--studio.netlify.app-D4F53C?style=for-the-badge&logo=netlify&logoColor=black)](https://htti-studio.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-0D0D0D?style=for-the-badge)](LICENSE)
[![Made with Love](https://img.shields.io/badge/Made%20by-CommitFrncs-D4F53C?style=for-the-badge&logo=github&logoColor=black)](https://github.com/CommitFrncs)

</div>

---

## ⬡ What is HTTI Studio?

**HTTI Studio** is a web app that converts raw HTML + CSS into downloadable images using the [htmlcsstoimage API](https://htmlcsstoimage.com). Built as a production-ready MVP with authentication, per-user settings, generation history, and PWA support.

> Built entirely on **mobile** using Acode — no PC required.

---

## ✨ Features

- 🔐 **Auth** — Email/Password, Google, GitHub (Firebase Auth)
- ⚙️ **Settings** — Width, height, scale, quality, format — saved per user
- 🖼️ **Image Generation** — Live preview + download button
- 📜 **History** — Reload any previous design from Firestore
- 📱 **PWA** — Installable on Android and iOS
- 🔒 **Secure** — API keys never exposed to frontend

---

## 🛠️ Tech Stack

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572b6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=f7df1e)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

</div>

---

## 📁 Project Structure

```
htti-studio/
├── client/
│   ├── index.html          ← Full UI
│   ├── styles.css          ← Dark theme styles
│   ├── app.js              ← All frontend logic
│   ├── manifest.json       ← PWA manifest
│   └── sw.js               ← Service worker
│
├── netlify/
│   └── functions/
│       └── generate.js     ← Serverless backend (replaces Express)
│
├── package.json            ← Root deps for Netlify Functions
├── netlify.toml            ← Netlify config
└── .gitignore
```

---

## 🚀 Deployment Guide

### 1. Firebase Setup
- Create a project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable **Authentication** → Email/Password + Google
- Enable **Firestore** in production mode
- Set security rules (see below)
- Grab your `firebaseConfig` from Project Settings → Web app

### 2. Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Environment Variables (Netlify)
| Key | Where to get it |
|---|---|
| `HTTI_USER_ID` | [htmlcsstoimage.com/dashboard](https://htmlcsstoimage.com/dashboard) |
| `HTTI_API_KEY` | [htmlcsstoimage.com/dashboard](https://htmlcsstoimage.com/dashboard) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Project Settings → Service Accounts → Generate key → minify JSON |
| `ALLOWED_ORIGIN` | Your Netlify URL e.g. `https://htti-studio.netlify.app` |

### 4. Deploy to Netlify
| Field | Value |
|---|---|
| Build command | `npm install` |
| Publish directory | `client` |
| Functions directory | `netlify/functions` |

---

## ⚠️ Known Issues & Fixes

> These are real problems encountered during deployment. Save yourself the headache.

---

### 🔴 "Something went wrong. Please try again."

**Cause:** Firebase config in `client/app.js` still has placeholder values (`YOUR_API_KEY` etc.)

**Fix:** Open `client/app.js` lines 13–20 and replace with your real Firebase config object from Firebase Console → Project Settings → Your apps.

---

### 🔴 "This site can't be reached — your_auth_domain"

**Cause:** Same as above. `authDomain` is still set to `"YOUR_AUTH_DOMAIN"`.

**Fix:** Same fix — paste your real `firebaseConfig` values.

---

### 🔴 Auth works locally but not on Netlify

**Cause:** Your Netlify domain isn't in Firebase's authorized domains list.

**Fix:**
1. Firebase Console → Authentication → Settings tab
2. Authorized domains → Add domain
3. Add exactly: `htti-studio.netlify.app` (no `https://`, no slash)

---

### 🔴 Google / GitHub sign-in does nothing on mobile

**Cause:** `signInWithPopup` gets blocked by mobile browsers.

**Fix:** Use `signInWithRedirect` instead. Already implemented in the latest version of `app.js`.

---

### 🔴 Netlify not auto-deploying after GitHub push

**Fix:** Go to Netlify → your site → Deploys tab → **Trigger deploy → Deploy site**. Also check that your repo is connected under Site configuration → Continuous deployment.

---

### 🔴 "Failed to fetch" when testing locally

**Cause:** Netlify Functions only run on Netlify's servers — not locally without the Netlify CLI.

**Fix:** Always test image generation on the **live Netlify URL**, not your local file.

---

### 🔴 Content Security Policy blocking Firebase

**Cause:** Overly strict CSP headers in `netlify.toml` blocking Firebase SDK network calls.

**Fix:** Remove the `Content-Security-Policy` header from `netlify.toml` or replace the entire file with the minimal version in this repo.

---

### 🔴 FIREBASE_SERVICE_ACCOUNT is not valid JSON

**Cause:** The service account JSON wasn't minified to a single line before pasting into Netlify env vars.

**Fix:** 
1. Download the JSON from Firebase → Service Accounts → Generate new private key
2. Go to [jsonformatter.org/json-minifier](https://jsonformatter.org/json-minifier)
3. Paste → Minify → Copy the output
4. Paste that single line as the env var value in Netlify

---

## 🤝 Connect

<div align="center">

<a href="https://github.com/CommitFrncs">
  <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=white"/>
</a>
<a href="mailto:fajayi175@gmail.com">
  <img src="https://img.shields.io/badge/Email-D4F53C?style=for-the-badge&logo=gmail&logoColor=black"/>
</a>

</div>

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:D4F53C,100:0D0D0D&height=120&section=footer"/>
</div>
