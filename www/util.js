// ── Sahaya shared utilities ──────────────────────────────────────────────────
// Classic script — exposes window.SAHAYA_UTIL. Loaded by every page.

(function () {
  "use strict";

  // ── Online/offline state ───────────────────────────────────────────────────
  function isOnline() { return navigator.onLine !== false; }

  var _offlineBanner = null;
  function showOfflineBanner() {
    if (_offlineBanner) return;
    _offlineBanner = document.createElement('div');
    _offlineBanner.id = 'sahaya-offline-banner';
    _offlineBanner.setAttribute('role', 'alert');
    _offlineBanner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:#B3261E;color:#fff;text-align:center;' +
      'padding:8px 16px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;' +
      'letter-spacing:0.5px;box-shadow:0 2px 12px rgba(0,0,0,0.3);';
    _offlineBanner.textContent = '⚠ You are offline. Changes will sync when connection returns.';
    document.body.appendChild(_offlineBanner);
  }

  function hideOfflineBanner() {
    if (_offlineBanner) {
      _offlineBanner.remove();
      _offlineBanner = null;
    }
  }

  // Listen for online/offline events
  window.addEventListener('online', hideOfflineBanner);
  window.addEventListener('offline', showOfflineBanner);
  // Check on load
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!isOnline()) showOfflineBanner();
    });
  }

  /** Escape a string for safe interpolation into innerHTML/template literals. */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Offline-safe initials avatar (replaces ui-avatars.com).
   * Returns an SVG data-URI with the first letter on the brand green.
   */
  function avatarDataUrl(name) {
    var letter = (String(name || "U").trim().charAt(0) || "U").toUpperCase();
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">' +
      '<rect width="192" height="192" rx="96" fill="#366759"/>' +
      '<text x="96" y="96" dy="0.36em" text-anchor="middle" ' +
      'font-family="Manrope, Arial, sans-serif" font-size="88" font-weight="800" ' +
      'fill="#FFFFFF">' + escapeHtml(letter) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /** Pick the best available photo for a profile record (never external-by-default). */
  function profilePhoto(profile, size) {
    if (profile && profile.photo && !/^https?:/.test(profile.photo)) {
      return profile.photo; // local data-URI captured in-app
    }
    return avatarDataUrl(profile && profile.name);
  }

  /**
   * fetch() with an AbortController timeout. Rejects with a friendly Error
   * whose .isTimeout is set on abort.
   */
  function fetchWithTimeout(url, options, timeoutMs) {
    var ms = timeoutMs || 30000;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    var opts = Object.assign({}, options || {}, { signal: controller.signal });
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  /** Normalise fetch failures into human-readable messages (incl. HTTP status). */
  async function fetchJson(url, options, timeoutMs) {
    var response;
    try {
      response = await fetchWithTimeout(url, options, timeoutMs);
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw Object.assign(new Error("The server took too long to respond. Please check your connection and try again."), { isTimeout: true });
      }
      throw new Error("You appear to be offline. Please check your connection and try again.");
    }
    if (!response.ok) {
      throw new Error("Service error (" + response.status + "). Please try again in a moment.");
    }
    try {
      return await response.json();
    } catch (err) {
      throw new Error("Unexpected server response. Please try again later.");
    }
  }

  /**
   * Retry a fetch call with exponential backoff.
   * @param {Function} fn - async function that performs the fetch
   * @param {number} maxRetries - max number of retry attempts (default 3)
   * @param {number} baseDelayMs - initial delay in ms (default 1000)
   * @returns {Promise} - resolves with fn's result
   */
  async function retryFetch(fn, maxRetries, baseDelayMs) {
    var retries = maxRetries || 3;
    var delay = baseDelayMs || 1000;
    var lastError;
    for (var attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          var jitter = Math.random() * delay * 0.3;
          await new Promise(function (r) { setTimeout(r, delay + jitter); });
          delay *= 2; // exponential backoff
        }
      }
    }
    throw lastError;
  }

  // ── Scoped storage: never share health data across users/profiles ─────────
  // Keys are namespaced as "<base>:<uid>:<profileId>" so family members sharing
  // a device can't read each other's chats/results.

  function scopeKey(base, uid, profileId) {
    return base + ":" + (uid || "anon") + ":" + (profileId || "-");
  }

  function scopedSetItem(base, uid, profileId, value) {
    try { localStorage.setItem(scopeKey(base, uid, profileId), value); } catch (e) { /* quota */ }
  }

  function scopedGetItem(base, uid, profileId) {
    try { return localStorage.getItem(scopeKey(base, uid, profileId)); } catch (e) { return null; }
  }

  function scopedRemoveItem(base, uid, profileId) {
    try { localStorage.removeItem(scopeKey(base, uid, profileId)); } catch (e) { /* noop */ }
  }

  /** Remove every key that starts with one of the given bases (used on logout). */
  function purgeScopedKeys(bases) {
    var doomed = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      for (var j = 0; j < bases.length; j++) {
        if (k.indexOf(bases[j] + ":") === 0) { doomed.push(k); break; }
      }
    }
    doomed.forEach(function (k) { localStorage.removeItem(k); });
    // Legacy unscoped keys from earlier builds.
    ["sahaya_chat_messages", "sahaya_assessment_result", "currentProfilePhoto"].forEach(function (legacy) {
      localStorage.removeItem(legacy);
    });
    try { sessionStorage.clear(); } catch (e) { /* noop */ }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────

  /** Go back if we came from inside the app; otherwise land on the fallback page. */
  function navBack(fallbackPage) {
    // In Capacitor the app loads from https://localhost — any localhost
    // referrer means in-app history exists to go back to.
    var ref = document.referrer || "";
    var inApp = ref.indexOf("localhost") !== -1 || ref.indexOf(location.origin) === 0;
    if (inApp && history.length > 1) {
      history.back();
    } else {
      location.href = fallbackPage || "index.html";
    }
  }

  /**
   * Inline dismissible banner instead of alert(). Appends to <body> if no
   * container given. kind: "info" | "error" | "success".
   */
  function toast(message, kind, timeoutMs) {
    var existing = document.getElementById("sahaya-toast");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.id = "sahaya-toast";
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.setAttribute("aria-live", "assertive");
    el.style.cssText =
      "position:fixed;left:16px;right:16px;bottom:24px;z-index:10000;" +
      "max-width:520px;margin:0 auto;padding:14px 18px;border-radius:12px;" +
      "font-family:Inter,sans-serif;font-size:14px;font-weight:600;line-height:1.45;" +
      "box-shadow:0 8px 30px rgba(32,26,25,.25);color:#fff;" +
      (kind === "error"
        ? "background:#B3261E;"
        : kind === "success" ? "background:#366759;" : "background:#404945;");
    el.textContent = message;
    el.addEventListener("click", function () { el.remove(); });
    document.body.appendChild(el);
    if (timeoutMs !== 0) {
      setTimeout(function () { el.remove(); }, timeoutMs || (kind === "error" ? 7000 : 3500));
    }
    return el;
  }

  /**
   * Simple client-side rate limiter.
   * @param {number} maxRequests - Max requests allowed in the window
   * @param {number} windowMs - Time window in milliseconds
   */
  function RateLimiter(maxRequests, windowMs) {
    this.maxRequests = maxRequests || 10;
    this.windowMs = windowMs || 60000;
    this.timestamps = [];
  }

  RateLimiter.prototype.check = function () {
    var now = Date.now();
    // Remove expired timestamps
    this.timestamps = this.timestamps.filter(function (ts) { return now - ts < this.windowMs; }.bind(this));
    if (this.timestamps.length >= this.maxRequests) {
      return false; // rate limited
    }
    this.timestamps.push(now);
    return true; // allowed
  };

  RateLimiter.prototype.getWaitSeconds = function () {
    if (this.timestamps.length === 0) return 0;
    var oldest = this.timestamps[0];
    var remaining = this.windowMs - (Date.now() - oldest);
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  window.SAHAYA_UTIL = {
    escapeHtml: escapeHtml,
    avatarDataUrl: avatarDataUrl,
    profilePhoto: profilePhoto,
    fetchJson: fetchJson,
    fetchWithTimeout: fetchWithTimeout,
    retryFetch: retryFetch,
    isOnline: isOnline,
    RateLimiter: RateLimiter,
    scopeKey: scopeKey,
    scopedSetItem: scopedSetItem,
    scopedGetItem: scopedGetItem,
    scopedRemoveItem: scopedRemoveItem,
    purgeScopedKeys: purgeScopedKeys,
    navBack: navBack,
    toast: toast
  };
})();
