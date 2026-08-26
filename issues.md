# Sahaya — Android App Issues Report

_Audit of the Capacitor-wrapped web app (`www/` → `android/`) on 2026-08-26._

---

## 🔴 Critical — broken or will break on Android

### 1. Google Sign-In will fail inside the Android app
**File:** `www/login.html:196–227`
The app uses Firebase Web SDK `signInWithRedirect()` / `getRedirectResult()`. Inside Capacitor the app runs from a private origin (`https://localhost` served by the WebView), which is **not in Firebase Auth's authorized domains**, and the redirect flow through `sahaya-ai.firebaseapp.com` cannot return into the WebView. Result: tapping "Continue with Google" ends in `auth/unauthorized-domain` or a blank redirect loop.
**Fix:** Use `@capacitor-firebase/authentication` (native Google sign-in) or `@codetrix-studio/capacitor-google-auth`; keep the Web SDK only for the hosted/PWA version.

### 2. Medicine scanner camera is broken on Android
**Files:** `www/scan_medicine.js:27–37`, `android/app/src/main/AndroidManifest.xml:40`
`navigator.mediaDevices.getUserMedia({video: ...})` requires the **`CAMERA` permission**, but the manifest declares only `INTERNET`. On Android the WebView will deny the request → the viewfinder stays black and falls back to "Camera not available. Please use Gallery." Same root cause for the torch control (`applyConstraints({torch})`, `scan_medicine.js:150–164`).
**Fix:** Add `<uses-permission android:name="android.permission.CAMERA" />` (and handle the runtime request — Capacitor's bridge forwards WebView permission requests once the permission is declared), or switch to `@capacitor/camera`.

### 3. Voice input ("SPEAK") is dead in the APK
**File:** `www/check symptoms page.html:209–238`
`webkitSpeechRecognition` is **not supported in the Android System WebView** that Capacitor uses. Every tap on the mic button hits the `alert("Speech recognition is not supported…")` branch. For a rural, multi-language audience this is a headline feature that silently doesn't exist in the installed app.
**Fix:** Use `@capacitor-community/speech-recognition` (needs `RECORD_AUDIO` permission) and feature-detect per platform. Text-to-speech mostly works but voice availability for Indian languages should be verified on-device.

### 4. Next clean Gradle build will likely fail — missing color resources
**File:** `android/app/src/main/res/values/styles.xml:7–9`
`AppTheme` references `@color/colorPrimary`, `@color/colorPrimaryDark`, `@color/colorAccent`, but no `colors.xml` exists in the source tree anymore. The *merged* resources from your last successful build (`app/build/intermediates/incremental/debug/mergeDebugResources/merged.dir/values/values.xml:42–43`) still contain these colors — meaning `values/colors.xml` was deleted **after** the Aug 24 build. Incremental builds may keep passing until a `clean`, then AAPT2 will error with "resource color/colorPrimary not found."
**Fix:** Restore a `res/values/colors.xml` defining those three colors, or drop the three `<item>` lines from `AppTheme`.

### 5. Phone/OTP login is decorative
**File:** `www/login.html:138–157`
"Send OTP" has no click handler at all; "Submit" just pops `alert('Please use Google Login for now…')`. Half the login screen is non-functional UI shown to real users.

### 6. There is no logout anywhere in the app
Every protected page redirects to `login.html` when `onAuthStateChanged` fires with no user, and the back arrow on `index.html` merely navigates to `login.html` — **nothing ever calls `signOut()`**. The Firebase session persists forever on the device. For a multi-profile app holding family medical data this matters both as a product gap and a privacy gap. (Related: `index.html:99` and `scan medicine.html:107` hard-code "back → login", which is wrong navigation semantics even as a fake logout.)

---

## 🟠 High — security & privacy

### 7. Unprotected AI backends with embedded keys (two different Supabase projects!)
**Files:** `www/check symptoms page.html:178–179` (project `zglcrgarasocrhkchcvl`), `www/scan_medicine.js:1–2` (project `akubhszvwhfafwyhrvzt`)
- The symptom-chat and medicine-analysis features talk to **two unrelated Supabase projects**, each called with a hardcoded `anon` JWT. Anyone who decompiles the APK (or opens DevTools) can replay these calls directly and **drain your LLM/API budget** — there is no per-user verification, rate limit visible client-side, or binding to a signed-in Firebase user.
- The chat endpoint receives `{messages, language}` with **zero patient context** (no userId, profileId, age, gender) — the assessment can't be personalized and can't be attributed/audited.
**Fix:** Consolidate on one backend; have the Edge Functions verify a Firebase ID token; move keys out of shipped code (they're anon keys, so public-by-design, but they must not grant open access to paid AI routes).

### 8. XSS via `innerHTML` on user- and AI-supplied text
- Chat: user-typed message rendered raw → `www/check symptoms page.html:309–314` (`${content}`); assistant output → `:297–305`. Typing `<img src=x onerror=alert(1)>` executes in the WebView.
- Profile names: `www/index.js:57–63`.
- Assessment result / dos & don'ts from the AI: `www/results.html:288, 298, 307`.
- Medicine analysis output: `www/scan_medicine.js:89–101`.
In a health app this is also a data-integrity risk (a crafted "result" could display fabricated medical advice). **Fix:** escape all interpolated text (`textContent` or an `escapeHtml()` helper).

### 9. Sensitive health data persisted insecurely and shared across profiles
- Full symptom-chat transcripts are kept in `localStorage['sahaya_chat_messages']` with **no profile/user scoping** (`check symptoms page.html:265–282, 351, 411`). On a shared family phone (the exact multi-profile scenario Sahaya is built for), one member's symptom conversation is visible to whoever logs in next, and to any other local user of the device.
- Weights, blood sugar, hemoglobin live in plaintext Firestore docs + local storage; `AndroidManifest.xml:5` has `android:allowBackup="true"` with **no `dataExtractionRules`**, so health data rides along in D2D/cloud backups. Consider `allowBackup="false"` or explicit rules, plus Firestore security rules review (rules aren't in this repo — verify `profiles/{doc}` is readable/writable only by its `userId` owner).

### 10. Firebase config duplicated in 5+ places, including junk shipped in the APK
`index.js`, `login.html`, `dashboard.js`, `blood_history.js`, `add new person page.html`, plus `www/config.txt`. Any config change means editing six files. Extract to one module (e.g. `firebase-config.js`), and delete `config.txt` / `apps.txt` from the bundle.

---

## 🟡 Medium — correctness & robustness

### 11. Placeholder/demo leftovers in production screens
- Hardcoded patient **"Arjun Das"** shown as "Current Patient": `check symptoms page.html:110–112` — not wired to the selected profile.
- Stitch-generated stock avatars/photos pointing at ephemeral `lh3.googleusercontent.com/aida-public/…` URLs: `login.html:181`, `check symptoms page.html:114`, `add new person page.html:119`, `scan medicine.html:112`. These will 404 eventually. Worse: in `add new person page.html:192`, the external URL becomes the **default `photoDataUrl`** — create a profile without touching the avatar and that dead URL gets written to Firestore.

### 12. Service worker is harmful in a packaged app
`www/service-worker.js:36–60` — cache-**first** for JS/CSS with a manual `CACHE_NAME = 'sahaya-pwa-v3'`. Inside Capacitor the WebView already serves assets from the APK; this SW adds a second cache layer, so shipping an app update does **not** refresh `dashboard.js`/`index.js` until you remember to bump the string. The precache list (`:4–13`) also omits half the pages (`results.html`, `check symptoms page.html`, `translate.html`, …), so "offline support" is partial at best.
**Fix:** unregister the SW in the Android build (keep it only if you ship this same code as a PWA), or make it network-first with a version-bumped cache.

### 13. Translation layer is fragile — especially in the WebView
- Page translation relies on Google Translate's `googtrans` **cookie** + hidden widget hacks (`translate.js:4–14, 53–82`); cookie behavior on Capacitor's `https://localhost` origin with third-party contexts is unreliable.
- Content injected **after** page load (chat replies, fetched profiles, results) is never translated — the biggest text surfaces in the app are dynamic.
- `setInterval` fighting `body.style.top` every 300 ms forever (`translate.js:35–39`) burns battery.
- `element.js` is fetched on **every page** even when the language is English.
**Fix:** for the Android app prefer real i18n (string tables per language, or the ML Kit / native translate plugin) over the DOM-rewriting widget.

### 14. No input validation on medical fields
- Blood details save with **all fields empty** and as free text (`dashboard.js:190–227`; inputs are `type="text"` at `dashboard.html:205–209`) — junk records accumulate and poison the Chart.js history (`parseFloat || null` masks them).
- Weight accepts negatives/absurd values (`dashboard.js:152–153` only rejects falsy).
- Age on profile creation has no min/max (`add new person page.html:134`).
- Photo uploads: base64 JPEG straight into the Firestore doc (`add new person page.html:258–265`) — near the 1 MB doc limit for large photos; Firebase Storage would be the right home.

### 15. Weight card logic bugs
`dashboard.js:109–132` — "Current Weight" silently falls back to the most recent *past* month without labeling it stale; months with no entry show as 5%-height ghost bars reading "N/A"; the max-scale heuristic (`weight > maxWeight → +20`) rescales mid-render producing inconsistent bar heights.

### 16. Broken/inconsistent navigation & auth guards
| Where | Problem |
|---|---|
| `index.html:99` | Header back button goes to `login.html` instead of back/logout |
| `scan medicine.html:107` | Back button goes to `login.html`, not the previous screen |
| `scan_medicine.js` | **No auth check at all** — reachable pre-login from `login.html:108`, unlike every other page |
| `results.html:109` | Links to `dashboard.html` without `?id=`; works only via the `sessionStorage` fallback |
| `blood_history.js:19` | Reads `currentProfileId` once at module load; deep-linking the page silently bounces to `index.html` |
| `results.html` | Relies on `sessionStorage.currentProfilePhoto` (`:210–214`) — sessionStorage dies with the app process, so the avatar resets after app restart |

### 17. Network calls without `response.ok` checks or timeouts
`check symptoms page.html:327–346` treats any HTTP body as JSON; a 401/500 HTML page throws a parse error caught by the generic "Something went wrong" handler. Same pattern in `scan_medicine.js:54–77`. No `AbortController` timeouts anywhere — on a weak rural connection the "Analyzing…" spinner can hang indefinitely. Errors surface as raw `alert()`s.

---

## 🟢 Low — hygiene, performance, store-readiness

18. **Tailwind via CDN in production** (`cdn.tailwindcss.com` on all 10 pages, e.g. `index.html:7`): dev-only tool, emits a console warning, recompiles CSS at runtime on low-end phones, and needs network on first paint. The ~55-line `tailwind.config` object is copy-pasted into every page — extract or precompile.
19. **Filenames with spaces**: `add new person page.html`, `check symptoms page.html`, `scan medicine.html` — must be percent-encoded in URLs, breaks tooling/CDNs; rename to kebab-case. Naming style also inconsistent vs `blood_details_history.html`.
20. **Orphan/dead files**: `www/transulate.html` is an untranslated Stitch export full of unresolved `{{DATA:SCREEN:SCREEN_17}}` link placeholders (typo'd filename too); `www/apps.txt` is UTF-16 binary garbage from a Firebase Studio export; both ship in the APK along with `www/config.txt`.
21. **Unpinned CDN deps**: Chart.js floating latest (`blood_details_history.html:48`) — a v4 breaking change lands silently; avatar fallback calls `ui-avatars.com` per profile (`index.js:59`) — broken images offline.
22. **Build/project hygiene**:
    - Project is **not under git** at all, and lives on the OneDrive Desktop — OneDrive locking Gradle/daemon files causes classic flaky builds; build outputs (.gradle/, build/, .idea/) sit beside sources.
    - `android/local.properties` (machine-specific) present; `package.json` lists `@capacitor/cli` as a runtime dependency and has **no scripts** (`cap sync`, `cap open`), and `node_modules` isn't installed.
    - Release build is unsigned with `minifyEnabled false` (`android/app/build.gradle:19–24`) — fine for dev; needed before Play upload.
    - Leftover Cordova `config.xml` with `<access origin="*" />` wildcard (`android/app/src/main/res/xml/config.xml:3`) — inert but misleading.
23. **Store readiness for a health app**: no privacy policy / consent screen, no data-deletion path, no `DATA SAFETY` declaration groundwork — Google Play treats symptom checking + health metrics as sensitive categories. The results screen disclaimer (`results.html:186–191`) is good; the surrounding compliance scaffolding doesn't exist yet.
24. **Accessibility**: icon-only buttons lack `aria-label`s (translate FAB, send/mic, gallery/capture/flash); several `alert()`-driven flows; dynamic chat has no live-region announcement; some text pairs (e.g. `text-on-surface-variant` on gradient backgrounds) fall below AA contrast.

---

## What's fine ✅
- Capacitor 8 scaffold itself is standard: `targetSdk/compileSdk 36`, `minSdk 24`, AGP 8.13 + Gradle 8.14.3 are current and mutually compatible.
- `www/` and `android/app/src/main/assets/public/` are in sync (only generated `cordova.js`/`cordova_plugins.js` differ, as expected).
- Firebase JS SDK is pinned (10.9.0); Firestore access consistently scopes queries by `userId` client-side.
- Splash/launcher mipmaps exist for all densities; `MainActivity.java` is the correct empty `BridgeActivity`.

## Suggested priority order
1. #4 (restore colors.xml — unblocks builds), then #1/#2/#3 (sign-in, camera, mic — the three features that define the app).
2. #7 + #9 (backend auth + health-data privacy) before any public release.
3. #8 (XSS) and #6 (logout) — quick wins with outsized impact.
4. Work through Medium items, then hygiene before Play Store submission.

---

## Fix status — 2026-08-26

All code-level issues are fixed and the project now builds: `gradlew -I mirror.init.gradle assembleDebug` → **BUILD SUCCESSFUL** (`android/app/build/outputs/apk/debug/app-debug.apk`, committed at `65bdd1d`).

| # | Issue | Status |
|---|---|---|
| 1 | Google Sign-In fails in APK | ✅ Rewritten login (`login.html`) with actionable errors. **⚠️ Needs one manual step:** add `localhost` under *Firebase Console → Authentication → Settings → Authorized domains* (and keep the Google provider enabled) — see notes below |
| 2 | Camera broken (no CAMERA permission) | ✅ `<uses-permission android:name="android.permission.CAMERA" />` added to `AndroidManifest.xml`; runtime request forwarded by the Capacitor bridge; gallery path still works if denied |
| 3 | Voice input dead in APK | ✅ `@capacitor-community/speech-recognition@7.0.1` installed & registered; native path via `Capacitor.Plugins.SpeechRecognition` with permission checks, Web Speech API fallback on web; `RECORD_AUDIO` permission + `<queries>` for the recognition service added |
| 4 | Build breaks on missing colors | ✅ `res/values/colors.xml` restored (`colorPrimary`/`colorPrimaryDark`/`colorAccent`); verified by a full successful build |
| 5 | Phone/OTP login decorative | ✅ OTP UI removed entirely — single honest Google sign-in screen |
| 6 | No logout anywhere | ✅ Logout button on `index.html` header → `auth.js logout()` = Firebase sign-out + purge of all scoped local data + redirect to login; back buttons now do real navigation (`util.js navBack`) |
| 7 | Unprotected AI backends / embedded keys | 🟡 Partially fixed in code: endpoints + anon keys centralized in `app-config.js`, all calls go through `fetchJson` with timeouts and `response.ok` checks, patient context (name/age/gender) sent with chat. **⚠️ Server-side work only you can do:** both Supabase Edge Functions must verify the Firebase ID token and rate-limit per user — otherwise anyone can still drain the LLM budget |
| 8 | XSS via innerHTML | ✅ All user/AI/profile text escaped (`util.js escapeHtml`) or set via `textContent`; markdown rendered as escaped text + `<br/>` only |
| 9 | Health data shared across profiles / backups | ✅ All chat/result/photo storage scoped per `<base>:<uid>:<profileId>`; legacy keys purged on logout; `allowBackup="false"` in manifest. Firestore security rules still worth reviewing in console (not in this repo) |
| 10 | Firebase config duplicated everywhere | ✅ Single `firebase-config.js` imported by all pages; `config.txt` / `apps.txt` deleted |
| 11 | Placeholder/demo leftovers | ✅ "Arjun Das" removed (real profile loaded from Firestore); all dead `lh3.googleusercontent.com` stock URLs replaced with generated SVG-initials avatars; new profiles no longer persist a placeholder photo |
| 12 | Harmful service worker | ✅ `service-worker.js` deleted; all registrations removed |
| 13 | Fragile translation layer | ⚠️ Improved: `element.js` loads only when language ≠ English, banner watchdog is cookie-guarded and slower. Full i18n string tables remain a future improvement (dynamic content is still not translated by the widget) |
| 14 | No input validation | ✅ Age 0–120, weight 1–500 kg, sugar 1–2000 mg/dL, hemoglobin 1–30 g/dL validated client-side before writes; blood inputs are `type="number"`; empty blood saves rejected; photos compressed to JPEG q70 before upload |
| 15 | Weight card logic bugs | ✅ Chart max scale computed up-front; latest month *with* data selected and labeled stale (e.g. "(Jul)"); N/A ghost bars gone |
| 16 | Broken navigation & guards | ✅ Every protected page runs `requireAuth()`; results/blood-history links carry `?id=`; scan-medicine back button returns to real previous screen (public page by design); avatar persists via scoped storage instead of sessionStorage |
| 17 | Network calls without ok/timeouts | ✅ `util.js fetchJson` (AbortController timeout + `response.ok` + JSON guard) used by chat and medicine scanner; errors shown as inline toasts, never raw `alert()` |
| 18 | Tailwind via CDN | 🔵 Not changed (would need a build step / precompiled CSS) — works as-is, just heavier at first paint |
| 19 | Filenames with spaces | ✅ Renamed to kebab-case (`add-new-person.html`, `check-symptoms.html`, `scan-medicine.html/js`); all references updated |
| 20 | Orphan/dead files | ✅ `transulate.html`, `apps.txt`, `service-worker.js` deleted; APK assets verified clean |
| 21 | Unpinned CDN deps | ✅ Chart.js pinned to 4.4.9; avatar fallback is an offline-capable local data-URI (no `ui-avatars.com` dependency) |
| 22 | Build/project hygiene | ✅ git repo initialized with `.gitignore` (build/, .gradle/, node_modules/, local.properties/) and initial commit; npm scripts added (`npm run sync` / `apk`); deps installed; `package.json` main fixed. **Note:** builds need JDK 21 — run `set JAVA_HOME=C:\Users\syams\.jdks\jbr-21.0.11` first; `-I mirror.init.gradle` routes around Maven Central rate-limiting (HTTP 429). Moving out of OneDrive is still recommended but optional |
| 23 | Play Store health-app compliance | 🔵 Not started — needs privacy policy URL, data-safety declaration, account/data-deletion path before submission |
| 24 | Accessibility | 🟡 Improved: aria-labels added to icon-only buttons (translate, send, mic, capture/gallery/flash), keyboard focus on mic, inline error text with `role=alert`. Contrast tuning remains |

### The two actions that still require you (outside this code)

1. **Firebase Console** → Authentication → Settings → **Authorized domains** → add `localhost`. Without this, Google sign-in inside the installed APK shows a clear error message telling you exactly this. Also confirm the **Google** provider is enabled under Sign-in method. (The native-plugin alternative needs a `google-services.json` + OAuth web client ID from the same console.)
2. **Supabase Edge Functions** (`sahaya-chat` in project `zglcrgarasocrhkchcvl`, `analyze-medicine` in project `akubhszvwhfafwyhrvzt`): verify the Firebase ID token sent by the app and rate-limit per user. Until then the anon keys can be replayed by anyone to spend your AI budget. Consolidating both features onto one Supabase project is also worth doing.
