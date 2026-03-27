// Sahaya Translation Module

// ── 1. Cookie helpers ─────────────────────────────────────────────────────────
function sahaya_setGoogleCookie(langCode) {
  var val = (langCode && langCode !== 'en') ? ('/en/' + langCode) : '/en/en';
  document.cookie = 'googtrans=' + val + '; path=/; SameSite=Lax';
  document.cookie = 'googtrans=' + val + '; SameSite=Lax';
}

function sahaya_clearGoogleCookie() {
  var exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'googtrans=; path=/; ' + exp + '; SameSite=Lax';
  document.cookie = 'googtrans=; ' + exp + '; SameSite=Lax';
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
    'body { top:0 !important; position:relative !important; }',
    '* { word-break: break-word !important; overflow-wrap: break-word !important; }',
    'button, a, span, p, h1, h2, h3, h4, h5, h6 { min-width: 0; }',
    'button { white-space: normal !important; }',
    'font   { font-size: inherit !important; }',
  ].join('\n');
  document.head.appendChild(s);
})();

// ── 3. Continuously fight the body-top shift Google re-applies ────────────────
setInterval(function () {
  if (document.body && document.body.style.top && document.body.style.top !== '0px') {
    document.body.style.top = '0px';
  }
}, 300);

// ── 4. Prevent Material Icons from being translated ───────────────────────────
function protectIcons() {
  document.querySelectorAll('.material-symbols-outlined, .material-icons').forEach(function (el) {
    el.setAttribute('translate', 'no');
    el.classList.add('notranslate');
  });
}
document.addEventListener('DOMContentLoaded', protectIcons);
setTimeout(protectIcons, 500);
setTimeout(protectIcons, 2000);

// ── 5. Google Translate widget callback ───────────────────────────────────────
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: 'en', includedLanguages: 'hi,ta,te,kn,ml,bn,mr,pa,gu,en', autoDisplay: false },
    'google_translate_element'
  );

  var lang = localStorage.getItem('sahaya_lang');

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

// ── 6. Navigate to translate page ─────────────────────────────────────────────
function openTranslatePage() {
  var page = window.location.href.split('/').pop().split('?')[0];
  if (!page || !page.endsWith('.html')) page = 'index.html';
  localStorage.setItem('sahaya_translate_return', page);
  window.location.href = 'translate.html';
}
