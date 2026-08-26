# Sahaya - AI Health & Symptom Checker

Sahaya is a comprehensive, multi-lingual AI-powered health assistant and profile management web application. It allows users to track their everyday health metrics, manage multiple profiles under one account, and consult a smart AI to evaluate their symptoms in real-time.

## 🏗️ Architecture Overview

The application is built using a purely serverless client-side architecture. It utilizes **Vanilla HTML/JS/TailwindCSS** for the frontend, **Firebase** for backend database and authentication, and a **Supabase Edge Function** to securely connect with LLMs for real-time symptom checking.

---

## 📌 Core Features & End-to-End Flow

### 1. Authentication (`login.html`)
- **Technology:** Firebase Authentication (Phone Number & OTP).
- **Flow:** Users sign in using their phone numbers. On successful verification, Firebase issues a secure session token, and the user is redirected to the Profile Selection screen.

### 2. Profile Management (`index.html` & `add new person page.html`)
- **Technology:** Firebase Firestore Database.
- **Flow:** 
  - A single phone number account can manage multiple family members (Profiles).
  - `index.html` queries the `profiles` Firestore collection for documents matching the current `userId`.
  - The UI securely caches the selected profile's ID passing it via query parameters (`?id=...`) and `sessionStorage` before navigating to the dashboard.

### 3. Health Tracking Dashboard (`dashboard.html` & `blood_details_history.html`)
- **Technology:** Firestore Real-time Updates, SessionStorage, & Chart.js/Vanilla DOM manipulation.
- **Flow:**
  - Connects to Firestore to pull specific health variables (`weightHistory`, `bloodHistory`).
  - Renders a purely native **Vertical Bar Graph** charting weight fluctuations over the last 6 months.
  - Allows the user to iteratively append new blood vitals (Sugar, Hemoglobin, Blood Count) over time, storing them into arrays that can be tracked historically.

### 4. Smart AI Symptom Checker (`check symptoms page.html`)
- **Technology:** Supabase Edge Functions, Web Speech API (STT/TTS), LocalStorage.
- **Flow:**
  - Acts as a dynamic chat interface communicating with a deployed Supabase backend logic block (`v1/sahaya-chat`).
  - Users can either type their symptoms or use the **Microphone** to dictate. Using `webkitSpeechRecognition`, spoken words are transcribed natively.
  - The AI responds contextually, and using `window.speechSynthesis`, the browser reads the AI's dialogue out loud.
  - **State Persistence:** The entire chat history is aggressively cached in `localStorage ('sahaya_chat_messages')`. If a user accidentally closes the tab or hits back, the chat immediately resumes exactly where it left off.
  - Upon conclusion (when AI determines `finished: true`), the symptom summary is saved securely to cache, and the AI redirects the user to the Results Page.

### 5. AI Risk Assessment & Results (`results.html`)
- **Technology:** Native DOM Parsing, Tailored CSS Classes.
- **Flow:**
  - Deserializes the AI's final verdict from `localStorage ('sahaya_assessment_result')`.
  - Dynamically calculates the **Risk Level UI** (Normal, Moderate, High) configuring respective color-coded warning banners.
  - Populates strict `Dos` and `Don'ts` arrays into visual grid cards.
  - Connects the user to a doctor tele-consultation simulation if further assistance is needed.

### 6. Deep Multi-Lingual Integration (`translate.html` & `translate.js`)
- **Technology:** Google Translate Core API.
- **Flow:**
  - A floating widget injects a global language translation layer directly onto the DOM framework, allowing deep navigation of the app in multiple Indian Regional Languages (`hi, ta, te, kn, ml...`).
  - **Symptom Checker Hook:** Translating the UI natively saves the user's intent to `sahaya_lang`. The Symptom Checker physically reads this cookie, and adjusts BOTH the **Speech Recognition API** and the **Text-to-Speech Engine** to specifically listen to / speak out native regional dialects alongside translating API data payloads!

---

## 🛠️ Data Infrastructure

### Firebase Firestore (`profiles` Collection)
Each user document stores:
- `userId`: Auth mapping
- `name`, `age`, `gender`, `photo`
- `weightHistory`: Object map (e.g., `{'2024-05': 75}`)
- `bloodHistory`: Array of dated objects `{date, sugar, hemoglobin, amount}`

### Supabase Edge Function
A secure gateway (`sahaya-chat`) that hides external LLM API Keys (like OpenAI/Claude). It processes the raw chat messages array along with user `language` instructions, interprets medical prompts, and returns clean, uniform JSON structures containing `riskLevel`, `summary`, and `dos/donts`.

### Application State (Browser Cache)
- `sessionStorage('currentProfileId')`: Retains which family member dashboard is active.
- `sessionStorage('currentProfilePhoto')`: Caches profile thumbnail across the app.
- `localStorage('sahaya_chat_messages')`: Restores partial mid-assessment chats.
- `localStorage('sahaya_assessment_result')`: Passes final AI medical summary safely between pages.
- `localStorage('sahaya_lang')`: Global translation lock for Speech-to-Text hooks.
