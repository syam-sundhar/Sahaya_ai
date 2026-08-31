// ── Sahaya Audit Logger ──────────────────────────────────────────────────────
// ES module that writes audit events to Firestore for compliance and debugging.
//
// Usage:
//   import { logAudit } from "./audit.js";
//   logAudit(db, userId, 'assessment_complete', { profileId, riskLevel });

import {
  collection, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/** App version — keep in sync with history-store.js */
const APP_VERSION = '1.1.0';

/**
 * Log an audit event to Firestore.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} action - Event type (e.g., 'login', 'assessment_complete')
 * @param {Object} [metadata] - Additional context data
 */
export async function logAudit(db, userId, action, metadata) {
  try {
    await addDoc(collection(db, "auditEvents"), {
      userId: userId,
      action: action,
      timestamp: Timestamp.now(),
      appVersion: APP_VERSION,
      platform: (window.Capacitor && window.Capacitor.isNativePlatform()) ? 'android' : 'web',
      metadata: metadata || {}
    });
  } catch (e) {
    // Audit logging should never break the user flow.
    console.warn("[Audit] Failed to log event:", action, e);
  }
}

/**
 * Predefined audit event types for consistency.
 */
export const AuditAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE_CREATE: 'profile_create',
  PROFILE_UPDATE: 'profile_update',
  ASSESSMENT_START: 'assessment_start',
  ASSESSMENT_COMPLETE: 'assessment_complete',
  REPORT_DOWNLOAD: 'report_download',
  MEDICINE_SCAN: 'medicine_scan',
  WEIGHT_UPDATE: 'weight_update',
  BLOOD_DETAILS_UPDATE: 'blood_details_update',
  LANGUAGE_CHANGE: 'language_change'
};
