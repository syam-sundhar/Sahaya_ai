// Sahaya Translation Module
//
// Strategy change vs. the original build: Google Translate's element.js is now
// injected ONLY when the user has picked a non-English language. English users
// no longer pay for a ~100KB third-party script on every page, and nothing
// runs when the app is used offline in English.

// ── 1. Cookie helpers ─────────────────────────────────────────────────────────
function sahaya_setGoogleCookie(langCode) {
  var val = '/en/' + langCode;
  document.cookie = 'googtrans=' + val + '; path=/; SameSite=Lax';
  document.cookie = 'googtrans=' + val + '; SameSite=Lax';
}

function sahaya_clearGoogleCookie() {
  var exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'googtrans=; path=/; ' + exp + '; SameSite=Lax';
  document.cookie = 'googtrans=; ' + exp + '; SameSite=Lax';
}

function sahaya_activeLang() {
  try { return localStorage.getItem('sahaya_lang') || 'en'; } catch (e) { return 'en'; }
}

// ── 2. Suppress Google Translate banner / toolbar ─────────────────────────────
(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.goog-te-banner-frame { display:none !important; visibility:hidden !important; }',
    '#goog-te-banner-frame  { display:none !important; visibility:hidden !important; }',
    /* Push off-screen so widget still renders+initialises (needed for .goog-te-combo) */
    '.goog-te-gadget { position:absolute !important; left:-99999px !important; top:-99999px !important; width:0 !important; height:0 !important; overflow:hidden !important; }',
    '.skiptranslate { display:none !important; }',
    'body { top:0 !important; position:relative !important; }'
  ].join('\n');
  document.head.appendChild(s);
})();

// ── 3. Fight the body-top shift Google re-applies — only while translating ────
var sahaya_translateWatchdog = setInterval(function () {
  if (!document.body) return;
  // Cheap guard first: bail immediately when we're not in translated mode.
  if (!document.cookie || document.cookie.indexOf('googtrans') === -1) return;
  if (document.body.style.top && document.body.style.top !== '0px') {
    document.body.style.top = '0px';
  }
}, 1500);

// ── 4. Prevent Material Icons from being translated ───────────────────────────
function protectIcons() {
  document.querySelectorAll('.material-symbols-outlined, .material-icons').forEach(function (el) {
    el.setAttribute('translate', 'no');
    el.classList.add('notranslate');
  });
}
document.addEventListener('DOMContentLoaded', function () {
  protectIcons();
  setTimeout(protectIcons, 800);
});
setTimeout(protectIcons, 2000);

// ── 5. Google Translate widget callback ───────────────────────────────────────
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: 'en', includedLanguages: 'hi,ta,te,kn,ml,bn,mr,pa,gu,en', autoDisplay: false },
    'google_translate_element'
  );

  var lang = sahaya_activeLang();
  if (!lang || lang === 'en') {
    sahaya_clearGoogleCookie();
    return;
  }

  // Primary: set cookie — Google Translate reads this automatically on load
  sahaya_setGoogleCookie(lang);

  // Fallback: also manipulate the combo element (works on some browser versions)
  var tries = 0;
  var timer = setInterval(function () {
    var sel = document.querySelector('.goog-te-combo');
    if (sel) {
      clearInterval(timer);
      if (sel.value !== lang) {
        sel.value = lang;
        sel.dispatchEvent(new Event('change'));
      }
    }
    if (++tries > 50) clearInterval(timer);
  }, 200);
}

// ── 6. Load element.js on demand (non-English only) ───────────────────────────
(function sahaya_loadTranslateWhenNeeded() {
  var lang = sahaya_activeLang();
  if (!lang || lang === 'en') return; // English / offline → don't fetch Google at all

  var s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.head.appendChild(s);
})();

// ── 7. Navigate to translate page ─────────────────────────────────────────────
function openTranslatePage() {
  var page = window.location.href.split('/').pop().split('?')[0];
  if (!page || !page.endsWith('.html')) page = 'index.html';
  localStorage.setItem('sahaya_translate_return', page);
  window.location.href = 'translate.html';
}
