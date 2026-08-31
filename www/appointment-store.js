// ── Sahaya Appointment Store ─────────────────────────────────────────────────
// ES module: Save/retrieve/update appointments in Firestore.
//
// Data model:
//   profiles/{profileId}/appointments/{appointmentId}
//     - userId, hospitalId, hospitalName, hospitalPhone, hospitalLat, hospitalLon
//     - patientName, patientAge, patientGender, problemSummary
//     - preferredDate (string YYYY-MM-DD), preferredTime (string HH:MM)
//     - status: "scheduled" | "attended" | "not_attended" | "rescheduled"
//     - notAttendedReason (string, if status = not_attended)
//     - createdAt, updatedAt
//
// Usage:
//   import { saveAppointment, getAppointments, updateAppointmentStatus } from "./appointment-store.js";

import {
  collection, addDoc, getDocs, getDoc, updateDoc, doc,
  query, orderBy, limit as firestoreLimit, Timestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/**
 * Save a new appointment to Firestore.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} profileId - Profile document ID
 * @param {Object} data - Appointment data
 * @returns {Promise<string>} The new appointment document ID
 */
export async function saveAppointment(db, userId, profileId, data) {
  var apptRef = collection(db, "profiles", profileId, "appointments");
  var now = Timestamp.now();

  var docData = {
    userId: userId,
    // Hospital info
    hospitalId: data.hospitalId || '',
    hospitalName: data.hospitalName || '',
    hospitalPhone: data.hospitalPhone || '',
    hospitalAddress: data.hospitalAddress || '',
    hospitalLat: data.hospitalLat || 0,
    hospitalLon: data.hospitalLon || 0,
    hospitalState: data.hospitalState || '',
    hospitalDistrict: data.hospitalDistrict || '',
    // Patient info (snapshot at time of booking)
    patientName: data.patientName || '',
    patientAge: data.patientAge || '',
    patientGender: data.patientGender || '',
    // Problem info (from assessment)
    problemSummary: data.problemSummary || '',
    riskLevel: data.riskLevel || '',
    // Scheduling
    preferredDate: data.preferredDate || '',
    preferredTime: data.preferredTime || '',
    // Status tracking
    status: 'scheduled',
    notAttendedReason: '',
    // Worker module fields (for future use)
    workerAssigned: '',
    workerNotes: '',
    rescheduledDate: '',
    rescheduledTime: '',
    // Timestamps
    createdAt: now,
    updatedAt: now
  };

  var docRef = await addDoc(apptRef, docData);
  return docRef.id;
}

/**
 * Get all appointments for a profile, sorted by newest first.
 *
 * @param {Object} db - Firestore instance
 * @param {string} userId - Firebase Auth UID
 * @param {string} profileId - Profile document ID
 * @param {number} [max] - Max results (default 20)
 * @returns {Promise<Array>}
 */
export async function getAppointments(db, userId, profileId, max) {
  var apptRef = collection(db, "profiles", profileId, "appointments");
  var q = query(apptRef, orderBy("createdAt", "desc"), firestoreLimit(max || 20));
  var snapshot = await getDocs(q);

  var results = [];
  snapshot.forEach(function (docSnap) {
    var data = docSnap.data();
    if (data.userId === userId) {
      results.push(Object.assign({ id: docSnap.id }, data));
    }
  });
  return results;
}

/**
 * Update appointment status and reason.
 *
 * @param {Object} db - Firestore instance
 * @param {string} profileId
 * @param {string} appointmentId
 * @param {string} status - "attended" | "not_attended" | "rescheduled"
 * @param {string} [reason] - Reason if not attended
 */
export async function updateAppointmentStatus(db, profileId, appointmentId, status, reason) {
  var apptDoc = doc(db, "profiles", profileId, "appointments", appointmentId);
  var update = {
    status: status,
    updatedAt: Timestamp.now()
  };
  if (reason) update.notAttendedReason = reason;
  await updateDoc(apptDoc, update);
}
