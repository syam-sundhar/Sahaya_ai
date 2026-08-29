// ── Sahaya History Store ────────────────────────────────────────────────────
// ES module that persists completed assessments (chat transcript + result)
// to Firestore under profiles/{profileId}/assessments/{assessmentId}.
//
// Usage:
//   import { saveAssessment, getAssessments, getAssessment, deleteAssessment } from "./history-store.js";

import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc,
  query, orderBy, limit as firestoreLimit, Timestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/**
 * Save a completed assessment with full chat transcript to Firestore.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} profileId - Profile document ID
 * @param {Object} data
 * @param {string} data.riskLevel - "Low" | "Moderate" | "High"
 * @param {string} data.summary - One-line summary from AI
 * @param {string} data.content - Full assessment text from AI
 * @param {string[]} data.dos - List of do's
 * @param {string[]} data.donts - List of don'ts
 * @param {Array} data.chatMessages - Full chat transcript [{role, content}, ...]
 * @param {string} data.language - Language code (e.g. "hi")
 * @param {Object} [data.patientData] - { name, age, gender }
 * @param {Object} [data.healthContext] - { weightHistory, bloodHistory } sent to AI
 * @returns {Promise<string>} - The new assessment document ID
 */
export async function saveAssessment(db, userId, profileId, data) {
  var assessRef = collection(db, "profiles", profileId, "assessments");

  var docData = {
    userId: userId,
    createdAt: Timestamp.now(),
    language: data.language || 'en',
    riskLevel: data.riskLevel || 'Unknown',
    summary: data.summary || '',
    fullContent: data.content || '',
    dos: Array.isArray(data.dos) ? data.dos : [],
    donts: Array.isArray(data.donts) ? data.donts : [],
    chatTranscript: Array.isArray(data.chatMessages)
      ? data.chatMessages.map(function (m, i) {
          return {
            role: m.role || 'user',
            content: m.content || '',
            index: i
          };
        })
      : [],
    patientSnapshot: data.patientData ? {
      name: data.patientData.name || '',
      age: data.patientData.age || '',
      gender: data.patientData.gender || ''
    } : null,
    healthContextSnapshot: data.healthContext ? {
      latestWeight: data.healthContext.latestWeight || null,
      latestBloodSugar: data.healthContext.latestBloodSugar || null,
      latestHemoglobin: data.healthContext.latestHemoglobin || null,
      pastAssessmentCount: data.healthContext.pastAssessmentCount || 0,
      pastRiskLevels: data.healthContext.pastRiskLevels || []
    } : null
  };

  var ref = await addDoc(assessRef, docData);
  return ref.id;
}

/**
 * Get all assessments for a profile, newest first.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID (for security verification)
 * @param {string} profileId - Profile document ID
 * @param {number} [maxResults=50] - Max number of assessments to fetch
 * @returns {Promise<Array>} - Array of { id, ...data } objects
 */
export async function getAssessments(db, userId, profileId, maxResults) {
  var max = maxResults || 50;
  var assessRef = collection(db, "profiles", profileId, "assessments");
  var q = query(assessRef, orderBy("createdAt", "desc"), firestoreLimit(max));

  var snapshot = await getDocs(q);
  var results = [];

  snapshot.forEach(function (docSnap) {
    var data = docSnap.data();
    // Only return assessments belonging to this user.
    if (data.userId === userId) {
      results.push(Object.assign({ id: docSnap.id }, data));
    }
  });

  return results;
}

/**
 * Get a single assessment by ID.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} profileId - Profile document ID
 * @param {string} assessmentId - Assessment document ID
 * @returns {Promise<Object|null>}
 */
export async function getAssessment(db, userId, profileId, assessmentId) {
  var docRef = doc(db, "profiles", profileId, "assessments", assessmentId);
  var snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  var data = snap.data();
  if (data.userId !== userId) return null; // security check
  return Object.assign({ id: snap.id }, data);
}

/**
 * Delete an assessment.
 *
 * @param {Object} db - Firestore instance
 * @param {string} profileId - Profile document ID
 * @param {string} assessmentId - Assessment document ID
 */
export async function deleteAssessment(db, profileId, assessmentId) {
  var docRef = doc(db, "profiles", profileId, "assessments", assessmentId);
  await deleteDoc(docRef);
}

/**
 * Get a summary of past assessments to send as health context to the AI.
 * Returns the latest N risk levels and summaries so the AI can reference
 * previous health issues when giving suggestions.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} profileId - Profile document ID
 * @param {number} [maxPast=5] - Max past assessments to include
 * @returns {Promise<Array>} - Array of { date, riskLevel, summary }
 */
export async function getPastAssessmentSummaries(db, userId, profileId, maxPast) {
  var max = maxPast || 5;
  var assessRef = collection(db, "profiles", profileId, "assessments");
  var q = query(assessRef, orderBy("createdAt", "desc"), firestoreLimit(max));

  var snapshot = await getDocs(q);
  var results = [];

  snapshot.forEach(function (docSnap) {
    var data = docSnap.data();
    if (data.userId === userId) {
      var dateStr = '';
      if (data.createdAt && data.createdAt.toDate) {
        dateStr = data.createdAt.toDate().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
      }
      results.push({
        date: dateStr,
        riskLevel: data.riskLevel || 'Unknown',
        summary: data.summary || data.fullContent || ''
      });
    }
  });

  return results;
}
