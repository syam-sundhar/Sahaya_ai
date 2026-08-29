// ── Sahaya Voice Engine ─────────────────────────────────────────────────────
// Unified TTS (Text-to-Speech) + STT (Speech-to-Text) manager.
// Classic script — exposes window.SAHAYA_VOICE. Loaded by pages that need voice.
//
// TTS:  Uses Web Speech API speechSynthesis with smart voice selection.
// STT:  Uses Capacitor @capacitor-community/speech-recognition on native,
//       falls back to webkitSpeechRecognition on the web/PWA build.

(function () {
  "use strict";

  var I18N = window.SAHAYA_I18N;

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEXT-TO-SPEECH (TTS)
  // ═══════════════════════════════════════════════════════════════════════════

  var isNative = window.Capacitor
    && typeof Capacitor.isNativePlatform === 'function'
    && Capacitor.isNativePlatform()
    && Capacitor.Plugins;

  var nativeTTS = isNative && Capacitor.Plugins.TextToSpeech ? Capacitor.Plugins.TextToSpeech : null;
  var hasWebSpeechTTS = 'speechSynthesis' in window;
  var ttsAvailable = !!nativeTTS || hasWebSpeechTTS;

  var voicesLoaded = false;
  var cachedVoices = [];

  // Preload web voices
  if (hasWebSpeechTTS && !nativeTTS) {
    cachedVoices = window.speechSynthesis.getVoices();
    if (!cachedVoices.length) {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        cachedVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
      });
    } else {
      voicesLoaded = true;
    }
  }

  function findWebVoice(langCode) {
    if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices();
    var code = (langCode || 'en').toLowerCase();
    var speechCode = I18N ? I18N.getSpeechCode(code) : code + '-IN';
    var exact = cachedVoices.find(function (v) {
      return v.lang && v.lang.toLowerCase() === speechCode.toLowerCase();
    });
    if (exact) return exact;
    var prefix = cachedVoices.find(function (v) {
      return v.lang && v.lang.toLowerCase().startsWith(code);
    });
    return prefix || null;
  }

  var currentCloudAudio = null;

  function speak(text, langCode) {
    return new Promise(function (resolve) {
      if (!ttsAvailable || !text) { resolve(); return; }
      
      var code = langCode || (I18N ? I18N.getLang() : 'en');
      var speechCode = I18N ? I18N.getSpeechCode(code) : code + '-IN';

      var googleApiKey = window.SAHAYA_BACKEND && window.SAHAYA_BACKEND.google ? window.SAHAYA_BACKEND.google.ttsApiKey : null;

      if (googleApiKey && googleApiKey.trim().length > 0) {
          // Use Google Cloud TTS
          stopSpeaking(); // stop any current speech
          fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + googleApiKey, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  input: { text: String(text) },
                  voice: { languageCode: speechCode },
                  audioConfig: { audioEncoding: 'MP3' }
              })
          }).then(function(res) {
              if (!res.ok) throw new Error("Cloud TTS API Failed");
              return res.json();
          }).then(function(data) {
              if (data.audioContent) {
                  currentCloudAudio = new Audio('data:audio/mp3;base64,' + data.audioContent);
                  currentCloudAudio.onended = resolve;
                  currentCloudAudio.onerror = function() { fallbackSpeak(text, speechCode, code, resolve); };
                  currentCloudAudio.play().catch(function() { fallbackSpeak(text, speechCode, code, resolve); });
              } else {
                  fallbackSpeak(text, speechCode, code, resolve);
              }
          }).catch(function(err) {
              console.error("Cloud TTS Error:", err);
              fallbackSpeak(text, speechCode, code, resolve);
          });
      } else {
          // No API key, use fallback
          fallbackSpeak(text, speechCode, code, resolve);
      }
    });
  }

  function fallbackSpeak(text, speechCode, code, resolve) {
      if (nativeTTS) {
          nativeTTS.speak({
              text: String(text),
              lang: speechCode,
              rate: 1.0,
              pitch: 1.0,
              category: "ambient"
          }).then(resolve).catch(function(e) {
              console.error("Native TTS Error:", e);
              resolve();
          });
      } else if (hasWebSpeechTTS) {
          try {
            window.speechSynthesis.cancel();
            var utterance = new SpeechSynthesisUtterance(String(text));
            utterance.lang = speechCode;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            var voice = findWebVoice(code);
            if (voice) utterance.voice = voice;
            utterance.onend = resolve;
            utterance.onerror = function () { resolve(); };
            window.speechSynthesis.speak(utterance);
            setTimeout(resolve, Math.max(text.length * 120, 8000));
          } catch (e) {
            resolve();
          }
      } else {
          resolve();
      }
  }

  function stopSpeaking() {
    if (currentCloudAudio) {
        currentCloudAudio.pause();
        currentCloudAudio.currentTime = 0;
        currentCloudAudio = null;
    }
    if (nativeTTS) {
        nativeTTS.stop().catch(function(){});
    } else if (hasWebSpeechTTS) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
    }
  }

  /**
   * Play a localized greeting for the given page key.
   * Uses i18n string tables for the greeting text.
   * Only plays if TTS is available.
   */
  function greet(i18nKey, params) {
    if (!I18N) return;
    var text = I18N.t(i18nKey, params);
    // Don't greet if the key returned the raw key (missing translation).
    if (text === i18nKey) return;
    // Small delay so the page has time to render first.
    setTimeout(function () { speak(text); }, 600);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SPEECH-TO-TEXT (STT)
  // ═══════════════════════════════════════════════════════════════════════════

  var isNative = window.Capacitor
    && typeof Capacitor.isNativePlatform === 'function'
    && Capacitor.isNativePlatform()
    && Capacitor.Plugins
    && Capacitor.Plugins.SpeechRecognition;

  var nativeSR = isNative ? Capacitor.Plugins.SpeechRecognition : null;

  var hasWebSpeech = !isNative && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  var sttListening = false;

  /**
   * Start speech recognition and return the transcript.
   * Uses native Capacitor plugin on Android, Web Speech API on web.
   *
   * @param {string} [langCode] - Language code (e.g. "hi"). Defaults to active.
   * @returns {Promise<string>} - Resolved with the transcript text, or "" on cancel/error.
   */
  function listen(langCode) {
    var code = langCode || (I18N ? I18N.getLang() : 'en');
    var speechCode = I18N ? I18N.getSpeechCode(code) : code + '-IN';

    if (nativeSR) {
      return listenNative(speechCode);
    } else if (hasWebSpeech) {
      return listenWeb(speechCode);
    } else {
      var U = window.SAHAYA_UTIL;
      if (U) U.toast(I18N ? I18N.t('error_generic') : "Voice input isn't supported here.", 'info');
      return Promise.resolve("");
    }
  }

  /** Native Capacitor speech recognition. */
  function listenNative(speechCode) {
    sttListening = true;
    return new Promise(function (resolve) {
      (async function () {
        try {
          // Check availability
          var avail;
          try { avail = await nativeSR.available(); } catch (e) { avail = true; }
          if (avail === false) {
            var U = window.SAHAYA_UTIL;
            if (U) U.toast("Speech recognition isn't available on this device.", 'error');
            sttListening = false;
            resolve("");
            return;
          }

          // Check & request permissions
          try {
            var perm = await nativeSR.checkPermissions();
            if (perm.speechRecognition !== 'granted') {
              var req = await nativeSR.requestPermissions();
              if (req.speechRecognition !== 'granted') {
                var U2 = window.SAHAYA_UTIL;
                if (U2) U2.toast("Please allow microphone access to use voice input.", 'error');
                sttListening = false;
                resolve("");
                return;
              }
            }
          } catch (e) { /* permission API differences — let start() surface errors */ }

          var result = await nativeSR.start({
            language: speechCode,
            maxResults: 1,
            partialResults: false
          });

          sttListening = false;
          var transcript = (result && result.matches && result.matches[0]) || "";
          resolve(transcript);
        } catch (err) {
          console.error('Native STT error:', err);
          sttListening = false;
          resolve("");
        }
      })();
    });
  }

  /** Web Speech API fallback. */
  function listenWeb(speechCode) {
    sttListening = true;
    var WebSR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return new Promise(function (resolve) {
      try {
        var recognition = new WebSR();
        recognition.continuous = false;
        recognition.lang = speechCode;
        recognition.interimResults = false;

        recognition.onresult = function (event) {
          sttListening = false;
          var transcript = event.results[0][0].transcript || "";
          resolve(transcript);
        };
        recognition.onerror = function (event) {
          console.error('Web STT error', event.error);
          sttListening = false;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            var U = window.SAHAYA_UTIL;
            if (U) U.toast("Please allow microphone access to use voice input.", 'error');
          }
          resolve("");
        };
        recognition.onend = function () {
          sttListening = false;
        };
        recognition.start();
      } catch (e) {
        console.error('Web STT start error:', e);
        sttListening = false;
        resolve("");
      }
    });
  }

  /** Stop any active STT session. */
  function stopListening() {
    if (nativeSR && sttListening) {
      try { nativeSR.stop(); } catch (e) { /* noop */ }
    }
    sttListening = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.SAHAYA_VOICE = {
    // TTS
    speak: speak,
    stopSpeaking: stopSpeaking,
    greet: greet,
    isTTSAvailable: function () { return ttsAvailable; },

    // STT
    listen: listen,
    stopListening: stopListening,
    isListening: function () { return sttListening; },
    isSTTAvailable: function () { return !!(nativeSR || hasWebSpeech); }
  };
})();
