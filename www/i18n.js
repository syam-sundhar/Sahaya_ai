// ── Sahaya Internationalization Engine ──────────────────────────────────────
// Replaces the Google Translate widget with proper client-side string tables.
// Classic script — exposes window.SAHAYA_I18N. Loaded by every page.
//
// How it works:
// 1. Static UI text lives in the `strings` object below, keyed by lang code.
// 2. DOM elements with `data-i18n="key"` get their textContent replaced.
// 3. Elements with `data-i18n-placeholder="key"` get their placeholder replaced.
// 4. Dynamic content (AI chat, medicine results) is translated SERVER-SIDE by
//    Gemini — the Edge Function receives `language` and responds natively.
// 5. t("key") returns the translated string at runtime for JS-built UI.

(function () {
  "use strict";

  // ── String tables ─────────────────────────────────────────────────────────
  // Each language has ~90 keys. English is the fallback for any missing key.

  var strings = {

    // ════════════════════════  ENGLISH  ════════════════════════════════════
    en: {
      // App-wide
      app_name: "SAHAYA",
      app_tagline: "Your AI Health Companion",
      back: "BACK",
      save: "Save",
      saving: "Saving...",
      saved: "Saved",
      cancel: "Cancel",
      close: "Close",
      delete_btn: "Delete",
      download: "Download",
      loading: "Loading...",
      error_generic: "Something went wrong. Please try again.",
      error_offline: "You appear to be offline. Please check your connection.",
      error_timeout: "The server took too long. Please try again.",

      // Language gate
      lang_gate_title: "Choose Your Language",
      lang_gate_subtitle: "Sahaya will speak and display in the language you choose.",
      lang_gate_voice: "Welcome to Sahaya! Please choose your language.",

      // Login
      login_title: "Welcome to Sahaya",
      login_subtitle: "Your personal AI health assistant for the whole family",
      login_google_btn: "Continue with Google",
      login_signing_in: "Signing in...",
      login_voice_greeting: "Welcome to Sahaya. Sign in to continue.",

      // Profile selection
      profiles_title: "Who needs care today?",
      profiles_subtitle: "Select a family member or add a new profile",
      profiles_add: "Add Profile",
      profiles_empty: "No profiles yet. Create one to get started.",
      profiles_voice_greeting: "Hello! Please select a family member.",
      logout_btn: "Logout",

      // Dashboard
      dash_greeting: "Hello, {name}!",
      dash_check_symptoms: "Check Symptoms",
      dash_check_symptoms_desc: "Talk to Sahaya about how you're feeling",
      dash_scan_medicine: "Scan Medicine",
      dash_scan_medicine_desc: "Scan a medicine label to know more",
      dash_history: "Assessment History",
      dash_history_desc: "View past consultations and download reports",
      dash_weight: "Current Weight",
      dash_weight_placeholder: "Enter weight in kg",
      dash_weight_update: "Update",
      dash_blood: "Blood Details",
      dash_blood_sugar: "Blood Sugar (mg/dL)",
      dash_blood_hemoglobin: "Hemoglobin (g/dL)",
      dash_blood_count: "Blood Count",
      dash_blood_save: "Save Blood Details",
      dash_blood_history_link: "View Blood History",
      dash_voice_greeting: "Hello {name}! What would you like to do today?",

      // Symptom checker
      symptom_title: "Symptom Checker",
      symptom_subtitle: "Describe how you're feeling. Sahaya is here to assist with preliminary guidance.",
      symptom_placeholder: "Type your symptoms...",
      symptom_send: "Send",
      symptom_mic_speak: "SPEAK",
      symptom_mic_listening: "LISTENING...",
      symptom_analyzing: "Analyzing...",
      symptom_assessment_complete: "Assessment Complete",
      symptom_view_result: "View Assessment Result",
      symptom_voice_greeting: "Tell me how you're feeling. You can speak or type your symptoms.",
      symptom_current_patient: "Current Patient",

      // Results
      result_title: "Screening Result",
      result_subtitle: "Based on your symptoms, we categorized your health status to help you decide next steps.",
      result_status: "Status",
      result_no_assessment: "No Recent Assessment",
      result_no_assessment_desc: "You haven't completed a symptom assessment recently.",
      result_go_check: "Start Symptom Check",
      result_self_care: "Self-Care Advice",
      result_self_care_desc: "Stay hydrated and maintain a balanced diet while tracking changes.",
      result_nearby: "Nearby Facilities",
      result_nearby_desc: "Find primary health centers near you for immediate examination.",
      result_disclaimer: "MANDATORY DISCLAIMER: This is not a medical diagnosis. Please consult a doctor.",
      result_talk_doctor: "Talk to Doctor",
      result_doctor_soon: "Doctor consultations are coming soon. For emergencies, please call 108.",
      result_download_report: "Download Report",
      result_voice_greeting: "Your health assessment is ready. Please review the results.",

      // Chat history
      history_title: "Assessment History",
      history_subtitle: "View past consultations and download reports for {name}",
      history_empty: "No assessments yet. Start a symptom check to create your first report.",
      history_download: "Download PDF",
      history_view: "View Details",
      history_risk: "Risk Level",
      history_date: "Date",
      history_delete_confirm: "Are you sure you want to delete this assessment?",

      // Medicine scanner
      medicine_title: "Scan Medicine",
      medicine_subtitle: "Capture or upload a medicine label to identify it",
      medicine_capture: "Capture",
      medicine_gallery: "Gallery",
      medicine_flash: "Flash",
      medicine_analyzing: "Analyzing medicine...",

      // Add person
      person_title: "Add Family Member",
      person_name: "Full Name",
      person_age: "Age",
      person_gender: "Gender",
      person_male: "Male",
      person_female: "Female",
      person_other: "Other",
      person_blood_group: "Blood Group",
      person_photo: "Profile Photo",
      person_save: "Save Profile",

      // Blood history
      blood_history_title: "Blood Details History",
      blood_history_sugar: "Blood Sugar",
      blood_history_hemoglobin: "Hemoglobin",

      // Translate page
      translate_title: "Choose Language",
      translate_subtitle: "Sahaya will speak and display in your chosen language",

      // Report
      report_title: "SAHAYA HEALTH ASSESSMENT REPORT",
      report_patient: "Patient",
      report_age: "Age",
      report_gender: "Gender",
      report_date: "Date",
      report_language: "Language",
      report_risk_level: "RISK LEVEL",
      report_summary: "SUMMARY",
      report_dos: "DO's",
      report_donts: "DON'Ts",
      report_transcript: "CHAT TRANSCRIPT",
      report_disclaimer: "DISCLAIMER: This is not a medical diagnosis. Please consult a qualified healthcare professional.",
      report_ai_label: "AI",
      report_you_label: "You",
    },

    // ════════════════════════  HINDI  ══════════════════════════════════════
    hi: {
      app_tagline: "आपका AI स्वास्थ्य साथी",
      back: "वापस",
      save: "सहेजें",
      saving: "सहेज रहे हैं...",
      saved: "सहेजा गया",
      cancel: "रद्द करें",
      close: "बंद करें",
      delete_btn: "हटाएं",
      download: "डाउनलोड",
      loading: "लोड हो रहा है...",
      error_generic: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
      error_offline: "आप ऑफ़लाइन हैं। कृपया कनेक्शन जाँचें।",
      error_timeout: "सर्वर ने बहुत देर लगाई। कृपया पुनः प्रयास करें।",

      lang_gate_title: "अपनी भाषा चुनें",
      lang_gate_subtitle: "सहाया आपकी चुनी हुई भाषा में बोलेगा और दिखाएगा।",
      lang_gate_voice: "सहाया में आपका स्वागत है! कृपया अपनी भाषा चुनें।",

      login_title: "सहाया में आपका स्वागत है",
      login_subtitle: "पूरे परिवार के लिए आपका व्यक्तिगत AI स्वास्थ्य सहायक",
      login_google_btn: "Google से जारी रखें",
      login_signing_in: "साइन इन हो रहा है...",
      login_voice_greeting: "सहाया में आपका स्वागत है। जारी रखने के लिए साइन इन करें।",

      profiles_title: "आज किसे देखभाल चाहिए?",
      profiles_subtitle: "परिवार का सदस्य चुनें या नई प्रोफ़ाइल जोड़ें",
      profiles_add: "प्रोफ़ाइल जोड़ें",
      profiles_empty: "अभी कोई प्रोफ़ाइल नहीं है। शुरू करने के लिए एक बनाएं।",
      profiles_voice_greeting: "नमस्ते! कृपया परिवार का सदस्य चुनें।",
      logout_btn: "लॉग आउट",

      dash_greeting: "नमस्ते, {name}!",
      dash_check_symptoms: "लक्षण जाँचें",
      dash_check_symptoms_desc: "सहाया से बताएं कि आप कैसा महसूस कर रहे हैं",
      dash_scan_medicine: "दवाई स्कैन करें",
      dash_scan_medicine_desc: "अधिक जानने के लिए दवाई का लेबल स्कैन करें",
      dash_history: "जाँच इतिहास",
      dash_history_desc: "पिछली जाँच देखें और रिपोर्ट डाउनलोड करें",
      dash_weight: "वर्तमान वज़न",
      dash_weight_placeholder: "वज़न किलो में दर्ज करें",
      dash_weight_update: "अपडेट",
      dash_blood: "रक्त विवरण",
      dash_blood_sugar: "रक्त शर्करा (mg/dL)",
      dash_blood_hemoglobin: "हीमोग्लोबिन (g/dL)",
      dash_blood_count: "रक्त गणना",
      dash_blood_save: "रक्त विवरण सहेजें",
      dash_blood_history_link: "रक्त इतिहास देखें",
      dash_voice_greeting: "नमस्ते {name}! आज आप क्या करना चाहेंगे?",

      symptom_title: "लक्षण जाँच",
      symptom_subtitle: "बताएं कि आप कैसा महसूस कर रहे हैं। सहाया मदद के लिए यहाँ है।",
      symptom_placeholder: "अपने लक्षण लिखें...",
      symptom_send: "भेजें",
      symptom_mic_speak: "बोलें",
      symptom_mic_listening: "सुन रहा है...",
      symptom_analyzing: "विश्लेषण हो रहा है...",
      symptom_assessment_complete: "जाँच पूरी हुई",
      symptom_view_result: "जाँच परिणाम देखें",
      symptom_voice_greeting: "बताइए आप कैसा महसूस कर रहे हैं। आप बोल सकते हैं या लिख सकते हैं।",
      symptom_current_patient: "वर्तमान मरीज़",

      result_title: "जाँच परिणाम",
      result_subtitle: "आपके लक्षणों के आधार पर, हमने आपकी स्वास्थ्य स्थिति को वर्गीकृत किया है।",
      result_status: "स्थिति",
      result_no_assessment: "कोई हालिया जाँच नहीं",
      result_no_assessment_desc: "आपने अभी तक कोई लक्षण जाँच पूरी नहीं की है।",
      result_go_check: "लक्षण जाँच शुरू करें",
      result_self_care: "स्व-देखभाल सलाह",
      result_self_care_desc: "हाइड्रेटेड रहें और संतुलित आहार लें।",
      result_nearby: "नज़दीकी सुविधाएं",
      result_nearby_desc: "तत्काल जाँच के लिए नज़दीकी स्वास्थ्य केंद्र खोजें।",
      result_disclaimer: "अनिवार्य अस्वीकरण: यह चिकित्सा निदान नहीं है। कृपया डॉक्टर से परामर्श करें।",
      result_talk_doctor: "डॉक्टर से बात करें",
      result_doctor_soon: "डॉक्टर परामर्श जल्द उपलब्ध होगा। आपातकाल में 108 पर कॉल करें।",
      result_download_report: "रिपोर्ट डाउनलोड करें",
      result_voice_greeting: "आपकी स्वास्थ्य जाँच तैयार है। कृपया परिणाम देखें।",

      history_title: "जाँच इतिहास",
      history_subtitle: "{name} की पिछली जाँच और रिपोर्ट",
      history_empty: "अभी कोई जाँच नहीं है। अपनी पहली रिपोर्ट बनाने के लिए लक्षण जाँच शुरू करें।",
      history_download: "PDF डाउनलोड",
      history_view: "विवरण देखें",
      history_risk: "जोखिम स्तर",
      history_date: "तारीख",
      history_delete_confirm: "क्या आप इस जाँच को हटाना चाहते हैं?",

      medicine_title: "दवाई स्कैन करें",
      medicine_subtitle: "दवाई के लेबल को कैप्चर या अपलोड करें",
      medicine_capture: "कैप्चर",
      medicine_gallery: "गैलरी",
      medicine_flash: "फ्लैश",
      medicine_analyzing: "दवाई का विश्लेषण हो रहा है...",

      person_title: "परिवार का सदस्य जोड़ें",
      person_name: "पूरा नाम",
      person_age: "उम्र",
      person_gender: "लिंग",
      person_male: "पुरुष",
      person_female: "महिला",
      person_other: "अन्य",
      person_blood_group: "रक्त समूह",
      person_photo: "प्रोफ़ाइल फोटो",
      person_save: "प्रोफ़ाइल सहेजें",

      blood_history_title: "रक्त विवरण इतिहास",
      blood_history_sugar: "रक्त शर्करा",
      blood_history_hemoglobin: "हीमोग्लोबिन",

      translate_title: "भाषा चुनें",
      translate_subtitle: "सहाया आपकी चुनी हुई भाषा में बोलेगा",

      report_title: "सहाया स्वास्थ्य जाँच रिपोर्ट",
      report_patient: "मरीज़",
      report_age: "उम्र",
      report_gender: "लिंग",
      report_date: "तारीख",
      report_language: "भाषा",
      report_risk_level: "जोखिम स्तर",
      report_summary: "सारांश",
      report_dos: "करें",
      report_donts: "न करें",
      report_transcript: "बातचीत",
      report_disclaimer: "अस्वीकरण: यह चिकित्सा निदान नहीं है। कृपया योग्य चिकित्सक से परामर्श करें।",
      report_ai_label: "AI",
      report_you_label: "आप",
    },

    // ════════════════════════  TAMIL  ══════════════════════════════════════
    ta: {
      app_tagline: "உங்கள் AI சுகாதார தோழன்",
      back: "பின்",
      save: "சேமி",
      saving: "சேமிக்கிறது...",
      saved: "சேமிக்கப்பட்டது",
      cancel: "ரத்து",
      close: "மூடு",
      delete_btn: "நீக்கு",
      download: "பதிவிறக்கம்",
      loading: "ஏற்றுகிறது...",
      error_generic: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
      error_offline: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். இணைப்பை சரிபார்க்கவும்.",

      lang_gate_title: "உங்கள் மொழியைத் தேர்வு செய்யுங்கள்",
      lang_gate_subtitle: "சஹாயா நீங்கள் தேர்ந்தெடுக்கும் மொழியில் பேசும் மற்றும் காண்பிக்கும்.",
      lang_gate_voice: "சஹாயாவுக்கு வரவேற்கிறோம்! உங்கள் மொழியைத் தேர்வு செய்யுங்கள்.",

      login_title: "சஹாயாவுக்கு வரவேற்கிறோம்",
      login_subtitle: "முழு குடும்பத்திற்கான உங்கள் AI சுகாதார உதவியாளர்",
      login_google_btn: "Google மூலம் தொடரவும்",
      login_voice_greeting: "சஹாயாவுக்கு வரவேற்கிறோம். தொடர உள்நுழையவும்.",

      profiles_title: "இன்று யாருக்கு கவனிப்பு தேவை?",
      profiles_subtitle: "குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும் அல்லது புதிய சுயவிவரம் சேர்க்கவும்",
      profiles_add: "சுயவிவரம் சேர்",
      profiles_empty: "இன்னும் சுயவிவரங்கள் இல்லை. தொடங்க ஒன்றை உருவாக்கவும்.",
      profiles_voice_greeting: "வணக்கம்! குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்.",
      logout_btn: "வெளியேறு",

      dash_greeting: "வணக்கம், {name}!",
      dash_check_symptoms: "அறிகுறிகளை சரிபார்",
      dash_check_symptoms_desc: "நீங்கள் எப்படி உணர்கிறீர்கள் என்று சஹாயாவிடம் சொல்லுங்கள்",
      dash_scan_medicine: "மருந்து ஸ்கேன்",
      dash_scan_medicine_desc: "மருந்து லேபிளை ஸ்கேன் செய்யுங்கள்",
      dash_history: "மதிப்பீட்டு வரலாறு",
      dash_history_desc: "முந்தைய ஆலோசனைகளைப் பாருங்கள்",
      dash_voice_greeting: "வணக்கம் {name}! இன்று என்ன செய்ய விரும்புகிறீர்கள்?",

      symptom_title: "அறிகுறி சோதனை",
      symptom_subtitle: "நீங்கள் எப்படி உணர்கிறீர்கள் என்று விவரிக்கவும்.",
      symptom_placeholder: "உங்கள் அறிகுறிகளை எழுதுங்கள்...",
      symptom_mic_speak: "பேசு",
      symptom_mic_listening: "கேட்கிறது...",
      symptom_analyzing: "பகுப்பாய்வு...",
      symptom_assessment_complete: "மதிப்பீடு முடிந்தது",
      symptom_view_result: "மதிப்பீட்டு முடிவைக் காண",
      symptom_voice_greeting: "உங்கள் அறிகுறிகளை சொல்லுங்கள். பேசலாம் அல்லது எழுதலாம்.",
      symptom_current_patient: "தற்போதைய நோயாளி",

      result_title: "பரிசோதனை முடிவு",
      result_disclaimer: "கட்டாய மறுப்பு: இது மருத்துவ நோயறிதல் அல்ல. மருத்துவரை அணுகவும்.",
      result_talk_doctor: "மருத்துவரிடம் பேசு",
      result_download_report: "அறிக்கை பதிவிறக்கம்",
      result_voice_greeting: "உங்கள் சுகாதார மதிப்பீடு தயாராக உள்ளது.",

      history_title: "மதிப்பீட்டு வரலாறு",
      history_empty: "இன்னும் மதிப்பீடுகள் இல்லை.",
      history_download: "PDF பதிவிறக்கம்",

      translate_title: "மொழி தேர்வு",

      report_title: "சஹாயா சுகாதார மதிப்பீட்டு அறிக்கை",
      report_patient: "நோயாளி",
      report_age: "வயது",
      report_gender: "பாலினம்",
      report_date: "தேதி",
    },

    // ════════════════════════  TELUGU  ═════════════════════════════════════
    te: {
      app_tagline: "మీ AI ఆరోగ్య సహచరుడు",
      back: "వెనుకకు",
      save: "సేవ్",
      saving: "సేవ్ అవుతోంది...",
      cancel: "రద్దు",
      download: "డౌన్‌లోడ్",
      loading: "లోడ్ అవుతోంది...",

      lang_gate_title: "మీ భాషను ఎంచుకోండి",
      lang_gate_subtitle: "సహాయ మీరు ఎంచుకున్న భాషలో మాట్లాడుతుంది మరియు చూపిస్తుంది.",
      lang_gate_voice: "సహాయకు స్వాగతం! దయచేసి మీ భాషను ఎంచుకోండి.",

      login_title: "సహాయకు స్వాగతం",
      login_subtitle: "మొత్తం కుటుంబానికి మీ వ్యక్తిగత AI ఆరోగ్య సహాయకుడు",
      login_google_btn: "Google తో కొనసాగించండి",
      login_voice_greeting: "సహాయకు స్వాగతం. కొనసాగించడానికి సైన్ ఇన్ చేయండి.",

      profiles_title: "ఈరోజు ఎవరికి సంరక్షణ అవసరం?",
      profiles_add: "ప్రొఫైల్ జోడించు",
      profiles_voice_greeting: "హలో! దయచేసి కుటుంబ సభ్యుడిని ఎంచుకోండి.",
      logout_btn: "లాగ్ అవుట్",

      dash_greeting: "హలో, {name}!",
      dash_check_symptoms: "లక్షణాలు తనిఖీ",
      dash_scan_medicine: "మందు స్కాన్",
      dash_history: "అసెస్‌మెంట్ చరిత్ర",
      dash_voice_greeting: "హలో {name}! ఈరోజు ఏం చేయాలనుకుంటున్నారు?",

      symptom_title: "లక్షణ తనిఖీ",
      symptom_placeholder: "మీ లక్షణాలను టైప్ చేయండి...",
      symptom_mic_speak: "మాట్లాడు",
      symptom_mic_listening: "వింటోంది...",
      symptom_voice_greeting: "మీ లక్షణాలు చెప్పండి. మాట్లాడవచ్చు లేదా టైప్ చేయవచ్చు.",

      result_title: "పరీక్ష ఫలితం",
      result_disclaimer: "తప్పనిసరి హెచ్చరిక: ఇది వైద్య నిర్ధారణ కాదు. దయచేసి వైద్యుడిని సంప్రదించండి.",
      result_download_report: "నివేదిక డౌన్‌లోడ్",
      result_voice_greeting: "మీ ఆరోగ్య అంచనా సిద్ధంగా ఉంది.",

      history_title: "అసెస్‌మెంట్ చరిత్ర",
      history_empty: "ఇంకా అసెస్‌మెంట్‌లు లేవు.",
      history_download: "PDF డౌన్‌లోడ్",

      translate_title: "భాష ఎంచుకోండి",
    },

    // ════════════════════════  KANNADA  ════════════════════════════════════
    kn: {
      app_tagline: "ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಂಗಾತಿ",
      lang_gate_title: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      lang_gate_voice: "ಸಹಾಯಕ್ಕೆ ಸ್ವಾಗತ! ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      login_title: "ಸಹಾಯಕ್ಕೆ ಸ್ವಾಗತ",
      login_google_btn: "Google ನೊಂದಿಗೆ ಮುಂದುವರಿಸಿ",
      login_voice_greeting: "ಸಹಾಯಕ್ಕೆ ಸ್ವಾಗತ. ಮುಂದುವರಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
      profiles_title: "ಇಂದು ಯಾರಿಗೆ ಆರೈಕೆ ಬೇಕು?",
      profiles_add: "ಪ್ರೊಫೈಲ್ ಸೇರಿಸಿ",
      profiles_voice_greeting: "ನಮಸ್ಕಾರ! ದಯವಿಟ್ಟು ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      dash_greeting: "ನಮಸ್ಕಾರ, {name}!",
      dash_check_symptoms: "ಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
      dash_history: "ಮೌಲ್ಯಮಾಪನ ಇತಿಹಾಸ",
      dash_voice_greeting: "ನಮಸ್ಕಾರ {name}! ಇಂದು ಏನು ಮಾಡಬೇಕೆಂದಿದ್ದೀರಿ?",
      symptom_title: "ಲಕ್ಷಣ ಪರಿಶೀಲಕ",
      symptom_placeholder: "ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ...",
      symptom_mic_speak: "ಮಾತಾಡು",
      symptom_voice_greeting: "ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಹೇಳಿ. ಮಾತನಾಡಬಹುದು ಅಥವಾ ಟೈಪ್ ಮಾಡಬಹುದು.",
      result_disclaimer: "ಕಡ್ಡಾಯ ಹಕ್ಕುತ್ಯಾಗ: ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಅಲ್ಲ. ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
      result_download_report: "ವರದಿ ಡೌನ್‌ಲೋಡ್",
      history_title: "ಮೌಲ್ಯಮಾಪನ ಇತಿಹಾಸ",
      translate_title: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    },

    // ════════════════════════  MALAYALAM  ══════════════════════════════════
    ml: {
      app_tagline: "നിങ്ങളുടെ AI ആരോഗ്യ സഹായി",
      lang_gate_title: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
      lang_gate_voice: "സഹായയിലേക്ക് സ്വാഗതം! ദയവായി നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.",
      login_title: "സഹായയിലേക്ക് സ്വാഗതം",
      login_google_btn: "Google ഉപയോഗിച്ച് തുടരുക",
      login_voice_greeting: "സഹായയിലേക്ക് സ്വാഗതം. തുടരാൻ സൈൻ ഇൻ ചെയ്യുക.",
      profiles_title: "ഇന്ന് ആർക്കാണ് പരിചരണം വേണ്ടത്?",
      profiles_add: "പ്രൊഫൈൽ ചേർക്കുക",
      profiles_voice_greeting: "ഹലോ! ദയവായി കുടുംബാംഗത്തെ തിരഞ്ഞെടുക്കുക.",
      dash_greeting: "ഹലോ, {name}!",
      dash_check_symptoms: "ലക്ഷണങ്ങൾ പരിശോധിക്കുക",
      dash_history: "വിലയിരുത്തൽ ചരിത്രം",
      dash_voice_greeting: "ഹലോ {name}! ഇന്ന് എന്ത് ചെയ്യണം?",
      symptom_title: "ലക്ഷണ പരിശോധന",
      symptom_placeholder: "ലക്ഷണങ്ങൾ ടൈപ്പ് ചെയ്യുക...",
      symptom_mic_speak: "സംസാരിക്കൂ",
      symptom_voice_greeting: "നിങ്ങളുടെ ലക്ഷണങ്ങൾ പറയൂ. സംസാരിക്കാം അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യാം.",
      result_disclaimer: "നിർബന്ധിത നിരാകരണം: ഇത് മെഡിക്കൽ ഡയഗ്നോസിസ് അല്ല. ഡോക്ടറെ സമീപിക്കുക.",
      result_download_report: "റിപ്പോർട്ട് ഡൗൺലോഡ്",
      history_title: "വിലയിരുത്തൽ ചരിത്രം",
      translate_title: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    },

    // ════════════════════════  BENGALI  ════════════════════════════════════
    bn: {
      app_tagline: "আপনার AI স্বাস্থ্য সঙ্গী",
      lang_gate_title: "আপনার ভাষা নির্বাচন করুন",
      lang_gate_voice: "সাহায়াতে স্বাগতম! দয়া করে আপনার ভাষা নির্বাচন করুন।",
      login_title: "সাহায়াতে স্বাগতম",
      login_google_btn: "Google দিয়ে চালিয়ে যান",
      login_voice_greeting: "সাহায়াতে স্বাগতম। চালিয়ে যেতে সাইন ইন করুন।",
      profiles_title: "আজ কার যত্ন দরকার?",
      profiles_add: "প্রোফাইল যোগ করুন",
      profiles_voice_greeting: "হ্যালো! দয়া করে একজন পরিবারের সদস্য নির্বাচন করুন।",
      dash_greeting: "হ্যালো, {name}!",
      dash_check_symptoms: "উপসর্গ পরীক্ষা",
      dash_history: "মূল্যায়ন ইতিহাস",
      dash_voice_greeting: "হ্যালো {name}! আজ আপনি কী করতে চান?",
      symptom_title: "উপসর্গ পরীক্ষক",
      symptom_placeholder: "আপনার উপসর্গ টাইপ করুন...",
      symptom_mic_speak: "বলুন",
      symptom_voice_greeting: "আপনার উপসর্গ বলুন। বলতে পারেন বা টাইপ করতে পারেন।",
      result_disclaimer: "বাধ্যতামূলক দাবিত্যাগ: এটি চিকিৎসা নির্ণয় নয়। দয়া করে ডাক্তারের সাথে পরামর্শ করুন।",
      result_download_report: "রিপোর্ট ডাউনলোড",
      history_title: "মূল্যায়ন ইতিহাস",
      translate_title: "ভাষা নির্বাচন করুন",
    },

    // ════════════════════════  MARATHI  ════════════════════════════════════
    mr: {
      app_tagline: "तुमचा AI आरोग्य सोबती",
      lang_gate_title: "तुमची भाषा निवडा",
      lang_gate_voice: "सहायामध्ये आपले स्वागत आहे! कृपया तुमची भाषा निवडा.",
      login_title: "सहायामध्ये आपले स्वागत आहे",
      login_google_btn: "Google ने सुरू ठेवा",
      login_voice_greeting: "सहायामध्ये आपले स्वागत आहे. पुढे जाण्यासाठी साइन इन करा.",
      profiles_title: "आज कोणाला काळजी हवी आहे?",
      profiles_add: "प्रोफाइल जोडा",
      profiles_voice_greeting: "नमस्कार! कृपया कुटुंबातील सदस्य निवडा.",
      dash_greeting: "नमस्कार, {name}!",
      dash_check_symptoms: "लक्षणे तपासा",
      dash_history: "मूल्यांकन इतिहास",
      dash_voice_greeting: "नमस्कार {name}! आज तुम्हाला काय करायचे आहे?",
      symptom_title: "लक्षण तपासणी",
      symptom_placeholder: "तुमची लक्षणे टाइप करा...",
      symptom_mic_speak: "बोला",
      symptom_voice_greeting: "तुमची लक्षणे सांगा. बोलू शकता किंवा टाइप करू शकता.",
      result_disclaimer: "अनिवार्य अस्वीकरण: हे वैद्यकीय निदान नाही. कृपया डॉक्टरांचा सल्ला घ्या.",
      result_download_report: "अहवाल डाउनलोड",
      history_title: "मूल्यांकन इतिहास",
      translate_title: "भाषा निवडा",
    },

    // ════════════════════════  GUJARATI  ═══════════════════════════════════
    gu: {
      app_tagline: "તમારો AI આરોગ્ય સાથી",
      lang_gate_title: "તમારી ભાષા પસંદ કરો",
      lang_gate_voice: "સહાયામાં આપનું સ્વાગત છે! કૃપયા તમારી ભાષા પસંદ કરો.",
      login_title: "સહાયામાં આપનું સ્વાગત છે",
      login_google_btn: "Google સાથે ચાલુ રાખો",
      login_voice_greeting: "સહાયામાં આપનું સ્વાગત છે. ચાલુ રાખવા સાઇન ઇન કરો.",
      profiles_title: "આજે કોને સંભાળની જરૂર છે?",
      profiles_add: "પ્રોફાઇલ ઉમેરો",
      dash_greeting: "નમસ્તે, {name}!",
      dash_check_symptoms: "લક્ષણો તપાસો",
      dash_history: "મૂલ્યાંકન ઇતિહાસ",
      dash_voice_greeting: "નમસ્તે {name}! આજે શું કરવા માંગો છો?",
      symptom_title: "લક્ષણ તપાસ",
      symptom_placeholder: "તમારા લક્ષણો લખો...",
      symptom_mic_speak: "બોલો",
      symptom_voice_greeting: "તમારા લક્ષણો કહો. બોલી શકો છો અથવા લખી શકો છો.",
      result_disclaimer: "ફરજિયાત અસ્વીકરણ: આ તબીબી નિદાન નથી. કૃપયા ડૉક્ટરનો સંપર્ક કરો.",
      result_download_report: "રિપોર્ટ ડાઉનલોડ",
      history_title: "મૂલ્યાંકન ઇતિહાસ",
      translate_title: "ભાષા પસંદ કરો",
    },

    // ════════════════════════  PUNJABI  ════════════════════════════════════
    pa: {
      app_tagline: "ਤੁਹਾਡਾ AI ਸਿਹਤ ਸਾਥੀ",
      lang_gate_title: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
      lang_gate_voice: "ਸਹਾਇਆ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ।",
      login_title: "ਸਹਾਇਆ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
      login_google_btn: "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
      login_voice_greeting: "ਸਹਾਇਆ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਜਾਰੀ ਰੱਖਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ।",
      profiles_title: "ਅੱਜ ਕਿਸ ਨੂੰ ਦੇਖਭਾਲ ਚਾਹੀਦੀ ਹੈ?",
      profiles_add: "ਪ੍ਰੋਫਾਈਲ ਜੋੜੋ",
      dash_greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, {name}!",
      dash_check_symptoms: "ਲੱਛਣ ਜਾਂਚੋ",
      dash_history: "ਮੁਲਾਂਕਣ ਇਤਿਹਾਸ",
      dash_voice_greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ {name}! ਅੱਜ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      symptom_title: "ਲੱਛਣ ਜਾਂਚ",
      symptom_placeholder: "ਆਪਣੇ ਲੱਛਣ ਲਿਖੋ...",
      symptom_mic_speak: "ਬੋਲੋ",
      symptom_voice_greeting: "ਆਪਣੇ ਲੱਛਣ ਦੱਸੋ। ਬੋਲ ਸਕਦੇ ਹੋ ਜਾਂ ਲਿਖ ਸਕਦੇ ਹੋ।",
      result_disclaimer: "ਲਾਜ਼ਮੀ ਬੇਦਾਅਵਾ: ਇਹ ਡਾਕਟਰੀ ਤਸ਼ਖ਼ੀਸ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਡਾਕਟਰ ਨਾਲ ਸਲਾਹ ਕਰੋ।",
      result_download_report: "ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ",
      history_title: "ਮੁਲਾਂਕਣ ਇਤਿਹਾਸ",
      translate_title: "ਭਾਸ਼ਾ ਚੁਣੋ",
    }
  };

  // ── Runtime API ───────────────────────────────────────────────────────────

  /** Get active language code. */
  function getLang() {
    try { return localStorage.getItem('sahaya_lang') || 'en'; } catch (e) { return 'en'; }
  }

  /** Set language code and persist. */
  function setLang(code) {
    try { localStorage.setItem('sahaya_lang', code); } catch (e) { /* quota */ }
  }

  /** Has the user ever picked a language? (for language gate). */
  function hasChosenLang() {
    try { return localStorage.getItem('sahaya_lang') !== null; } catch (e) { return true; }
  }

  /**
   * Translate a key. Falls back to English if missing in active language.
   * Supports {placeholder} replacement via params object.
   *   t("dash_greeting", {name: "Arjun"}) → "Hello, Arjun!"
   */
  function t(key, params) {
    var lang = getLang();
    var str = (strings[lang] && strings[lang][key]) || (strings.en && strings.en[key]) || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
      });
    }
    return str;
  }

  /**
   * Get the language name map (code → English name).
   */
  var langNameMap = {
    en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
    kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi',
    gu: 'Gujarati', pa: 'Punjabi'
  };

  /** Speech recognition BCP-47 code for the active language. */
  var speechCodeMap = {
    en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
    kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN',
    gu: 'gu-IN', pa: 'pa-IN'
  };

  function getLangName(code) { return langNameMap[code || getLang()] || 'English'; }
  function getSpeechCode(code) { return speechCodeMap[code || getLang()] || 'en-IN'; }

  /**
   * Walk the DOM and apply translations to elements with data-i18n attributes.
   * Call once after DOMContentLoaded.
   */
  function applyTranslations(root) {
    var el = root || document;

    // data-i18n → textContent
    el.querySelectorAll('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      if (key) node.textContent = t(key);
    });

    // data-i18n-placeholder → placeholder attribute
    el.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      var key = node.getAttribute('data-i18n-placeholder');
      if (key) node.placeholder = t(key);
    });

    // data-i18n-html → innerHTML (only for trusted, hardcoded keys)
    el.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      var key = node.getAttribute('data-i18n-html');
      if (key) node.innerHTML = t(key);
    });

    // data-i18n-aria → aria-label
    el.querySelectorAll('[data-i18n-aria]').forEach(function (node) {
      var key = node.getAttribute('data-i18n-aria');
      if (key) node.setAttribute('aria-label', t(key));
    });
  }

  // Auto-apply on DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyTranslations(); });
  } else {
    // DOM already loaded (script at bottom of body).
    setTimeout(function () { applyTranslations(); }, 0);
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  window.SAHAYA_I18N = {
    getLang: getLang,
    setLang: setLang,
    hasChosenLang: hasChosenLang,
    t: t,
    getLangName: getLangName,
    getSpeechCode: getSpeechCode,
    applyTranslations: applyTranslations,
    langNameMap: langNameMap,
    speechCodeMap: speechCodeMap
  };
})();
