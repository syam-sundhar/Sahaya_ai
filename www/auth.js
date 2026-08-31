// ── Sahaya shared auth module (ES module) ────────────────────────────────────
// One Firebase app instance per page. Usage in any page's module script:
//   import { auth, db, requireAuth, logout } from "./auth.js";
//   const user = await requireAuth();          // redirects to login if signed out

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut as fbSignOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const cfg = window.SAHAYA_FIREBASE_CONFIG;
const U = window.SAHAYA_UTIL;

const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

/** Promise that resolves with the signed-in user, or redirects to login and never resolves. */
function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Remember where the user was heading so login can send them back.
        try { sessionStorage.setItem("sahaya_post_login", location.href.split("/").pop()); } catch (e) { /* noop */ }
        location.href = "login.html";
        return; // never resolve
      }
      resolve(user);
    });
  });
}

/**
 * Sign out everywhere: clear scoped health data + profile hints, then go to
 * the login page.
 */
async function logout() {
  try { await fbSignOut(auth); } catch (e) { console.error("signOut failed", e); }
  U.purgeScopedKeys([
    "sahaya_chat",
    "sahaya_result",
    "sahaya_profile_photo"
  ]);
  // Note: `sahaya_lang` is deliberately kept — language is a device-level
  // preference, not health data.
  location.replace("login.html");
}

export { app, auth, db, requireAuth, logout };
