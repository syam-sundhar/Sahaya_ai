// ── Sahaya backend endpoints (Supabase Edge Functions) ───────────────────────
// Loaded as a classic script; read via window.SAHAYA_BACKEND.
//
// SECURITY NOTE: the anon keys below are public by design — they identify the
// project, not the caller. The Edge Functions MUST verify the caller's Firebase
// ID token server-side and rate-limit per user, otherwise anyone can replay
// these calls from outside the app and burn the LLM budget. See issues.md #7.
window.SAHAYA_BACKEND = {
  // Symptom-checker chat function
  chat: {
    url: "https://zglcrgarasocrhkchcvl.supabase.co/functions/v1/sahaya-chat",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbGNyZ2FyYXNvY3Joa2NoY3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDcxMDksImV4cCI6MjA5MDE4MzEwOX0.B6HwAdEBLa_1Ql20Z753ntNKXxoeLXzaLkdcBydsiHg",
    timeoutMs: 45000
  },
  // Medicine label analysis function
  medicine: {
    base: "https://akubhszvwhfafwyhrvzt.supabase.co",
    analyzePath: "/functions/v1/analyze-medicine",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWJoc3p2d2hmYWZ3eWhydnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjQwNTMsImV4cCI6MjA5MDIwMDA1M30.Uxfzp8boA7uPSYL7M5rDyg5cwt8IChtqs_75iCDCJmM",
    timeoutMs: 60000
  }
};
