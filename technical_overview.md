# Sahaya Health App: Technical Architecture Overview

This document provides a high-level overview of the backend, APIs, and AI integrations that power the Sahaya Health App.

---

## 1. Core Technology Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | User interface and client-side logic. |
| **Authentication** | Firebase Auth | Secure user login, signup, and session management. |
| **Database** | Firebase Firestore | Storing user profiles, health metrics, and history. |
| **AI Backend** | Supabase Edge Functions | Serverless logic for processing AI requests. |
| **AI Model** | Google Gemini | Large Language Model (LLM) for medical logic. |
| **PWA** | Manifest + Service Worker | Enables installation and offline capabilities. |

---

## 2. API & AI Integration (Gemini via Supabase)
The application uses **Supabase Edge Functions** as a secure bridge between the frontend and the **Google Gemini API**. This ensures that API keys are never exposed to the client.

### A. Symptom Checker (`sahaya-chat`)
*   **Endpoint:** `https://zglcrgarasocrhkchcvl.supabase.co/functions/v1/sahaya-chat`
*   **Input:** User's text description of symptoms or voice-to-text input.
*   **Logic:**
    1.  Frontend sends user input and chat history to the Edge Function.
    2.  The Edge Function instructs **Gemini** to act as a triage assistant.
    3.  Gemini analyzes symptoms and returns a risk level (Low, Medium, High) and advice.
    4.  Frontend redirects the user to the [results.html](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/results.html) page based on the risk level.

### B. Medicine Scanner (`analyze-medicine`)
*   **Endpoint:** `https://akubhszvwhfafwyhrvzt.supabase.co/functions/v1/analyze-medicine`
*   **Input:** Base64 encoded image captured from the device camera.
*   **Logic:**
    1.  Device uses `navigator.mediaDevices.getUserMedia` to capture a high-res frame.
    2.  Image is sent to the Edge Function.
    3.  The Function uses **Gemini Pro Vision** to identify the medicine and parse text from the label.
    4.  Returns structured JSON: `name`, `purpose`, `usage`, and `warnings`.

---

## 3. Database Schema (Firestore)
The application stores persistent data in the `sahaya-ai` Firestore project.

*   **`profiles` Collection:**
    *   `userId`: Unique ID from Firebase Auth.
    *   `name`, [age](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/check%20symptoms%20page.html#289-319), `gender`: Basic demographic data.
    *   `bloodGroup`, `weight`, `height`: Health metrics.
    *   `photoURL`: Link to the user's profile image (or dynamic fallback).

---

## 4. Multi-Language Translation System
Sahaya uses a hybrid approach for high-performance localized translation:

*   **Engine:** Google Translate Web Widget API.
*   **Persistence:** The selected language code (e.g., `hi` for Hindi, [te](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/translate.js#41-48) for Telugu) is stored in `localStorage` (`sahaya_lang`).
*   **Script ([translate.js](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/translate.js)):** 
    *   Automatically sets the `googtrans` cookie on page load.
    *   Suppresses the default Google Translate top-bar UI for a native premium feel.
    *   Uses a "Protection" script to ensure Material Icons and technical terms aren't accidentally translated.

---

## 5. PWA (Progressive Web App) Standards
*   **Manifest ([manifest.json](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/manifest.json)):** Defines the app name, theme colors (`#366759`), and standalone display mode.
*   **Service Worker ([service-worker.js](file:///c:/Users/syams/OneDrive/Desktop/stitch_duplicate_of_welcome_to_sahaya/service-worker.js)):**
    *   **Network-First Strategy:** Tries to fetch latest AI data from the web first.
    *   **Fallback-to-Cache:** If offline, it serves cached HTML, JS, and the logo to ensure the app remains functional.
    *   **Maskable Icons:** Includes 512x512 adaptive icons for professional mobile installation.
