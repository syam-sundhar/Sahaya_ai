// ── Sahaya shared Firebase configuration ─────────────────────────────────────
// Single source of truth. Every page loads this as a classic script BEFORE any
// module that needs Firebase, then reads window.SAHAYA_FIREBASE_CONFIG.
//
// NOTE: these values are public client identifiers by design (Firebase web
// API keys are not secrets), but keep them in one place so they can be
// rotated / restricted from the Firebase console without code archaeology.
window.SAHAYA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAsSMEzG_Up6pJwzBUSD8oW5VuY5XhmCuA",
  authDomain: "sahaya-ai.firebaseapp.com",
  projectId: "sahaya-ai",
  storageBucket: "sahaya-ai.firebasestorage.app",
  messagingSenderId: "648285547085",
  appId: "1:648285547085:web:756f7440911378888eca04",
  measurementId: "G-FQ3F0N3HE0"
};

// Shared Firebase SDK version — bump once here.
window.SAHAYA_FIREBASE_SDK_BASE = "https://www.gstatic.com/firebasejs/10.9.0/";
