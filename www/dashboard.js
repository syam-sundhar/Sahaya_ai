import { db, requireAuth } from "./auth.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const U = window.SAHAYA_UTIL;

const urlParams = new URLSearchParams(window.location.search);
let profileId = urlParams.get('id');

if (!profileId) {
  profileId = sessionStorage.getItem('currentProfileId');
  if (profileId) {
     const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + encodeURIComponent(profileId);
     window.history.replaceState({path:newurl}, '', newurl);
  } else {
     window.location.href = 'index.html';
  }
} else {
  sessionStorage.setItem('currentProfileId', profileId);
}

let currentProfileData = null;
let currentUid = null;

const user = await requireAuth(); // redirects to login.html when signed out
currentUid = user.uid;

try {
  const docRef = doc(db, "profiles", profileId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data().userId === user.uid) {
    currentProfileData = docSnap.data();
    populateProfileUI(currentProfileData);
  } else {
    U.toast("Profile not found or you don't have access to it.", 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  }
} catch (error) {
  console.error("Error fetching profile:", error);
  U.toast("Error loading profile. Please check your connection.", 'error');
}

function populateProfileUI(data) {
  // Local, offline-safe photo for the results page header (scoped per user+profile)
  const photoUrl = U.profilePhoto(data);
  U.scopedSetItem('sahaya_profile_photo', currentUid, profileId, photoUrl);

  document.getElementById('header-profile-img').src = photoUrl;
  document.getElementById('main-profile-img').src = photoUrl;
  document.getElementById('main-profile-name').innerText = data.name || 'Unknown';
  document.getElementById('main-profile-age').innerText = `Age: ${data.age || 'N/A'}`;

  if (data.gender) {
      const genderItem = document.getElementById('main-profile-gender');
      genderItem.style.display = 'inline-block';
      genderItem.innerText = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
  }

  // Blood Details Pre-fill (latest off history or legacy bloodDetails array)
  if (data.bloodHistory && data.bloodHistory.length > 0) {
      const sortedHistory = [...data.bloodHistory].sort((a,b) => new Date(b.date) - new Date(a.date));
      fillBloodInputs(sortedHistory[0]);
  } else if (data.bloodDetails) {
      fillBloodInputs(data.bloodDetails); // legacy format
  }

  renderWeightChart(data.weightHistory || {});
}

function fillBloodInputs(record) {
    document.getElementById('blood-sugar').value = record.sugar || '';
    document.getElementById('hemoglobin').value = record.hemoglobin || '';
    document.getElementById('blood-amount').value = record.amount || '';
}

function renderWeightChart(weightHistory) {
    const chartContainer = document.getElementById('weight-chart-container');
    const weightDisplay = document.getElementById('current-weight-display');
    chartContainer.innerHTML = '';

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    // Build the last 6 months in order.
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const past = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`;
        last6Months.push({
            key,
            monthLabel: monthNames[past.getMonth()],
            weight: Number(weightHistory[key]) || 0,
            isCurrent: i === 0
        });
    }

    // Consistent scale computed once from the actual data.
    const recordedWeights = last6Months.filter(m => m.weight > 0).map(m => m.weight);
    const maxWeight = Math.max(60, ...recordedWeights) * 1.15;

    // Latest entry = most recent month WITH data (may not be the current month).
    let latest = null;
    for (let i = last6Months.length - 1; i >= 0; i--) {
        if (last6Months[i].weight > 0) { latest = last6Months[i]; break; }
    }

    if (latest) {
        const staleLabel = latest.isCurrent ? '' : `<span class="text-[10px] font-semibold text-on-surface-variant ml-1">(${latest.monthLabel})</span>`;
        weightDisplay.innerHTML =
            `${U.escapeHtml(latest.weight)}<span class="text-sm font-bold text-primary/70 ml-1">kg</span>${staleLabel}`;
    } else {
        weightDisplay.innerHTML = `--<span class="text-sm font-bold text-primary/70 ml-1">kg</span>`;
    }

    last6Months.forEach(m => {
        const barHeight = m.weight ? Math.max((m.weight / maxWeight) * 100, 10) : 5;

        const div = document.createElement('div');
        div.className = "flex flex-col items-center gap-2 w-full";
        div.innerHTML = `
          <div class="w-full bg-surface-dim rounded-t-xl relative h-24 flex items-end justify-center group">
            <div class="w-full ${m.isCurrent ? 'bg-primary' : 'bg-primary/50'} rounded-t-xl transition-all duration-300 cursor-pointer" style="height: ${barHeight}%"></div>
            <span class="absolute -top-6 text-[10px] font-bold ${m.isCurrent ? 'text-primary' : 'text-on-surface-variant'} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">${m.weight ? m.weight + 'kg' : 'No data'}</span>
          </div>
          <span class="text-[10px] ${m.isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}">${m.monthLabel}</span>
        `;
        chartContainer.appendChild(div);
    });
}

// ── Weight update ────────────────────────────────────────────────────────────
document.getElementById('weight-submit-btn').addEventListener('click', async function() {
  const input = document.getElementById('weight-input');
  const val = parseFloat(input.value);
  if (!profileId) return;
  if (!val || val < 1 || val > 500) {
    U.toast("Please enter a weight between 1 and 500 kg.", 'error');
    input.focus();
    return;
  }

  const originalHTML = this.innerHTML;
  this.innerHTML = "Saving...";
  this.disabled = true;

  try {
    const d = new Date();
    const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const updatedHistory = { ...(currentProfileData?.weightHistory || {}) };
    updatedHistory[currentMonthKey] = val;

    await updateDoc(doc(db, "profiles", profileId), { weightHistory: updatedHistory });

    if(!currentProfileData) currentProfileData = {};
    currentProfileData.weightHistory = updatedHistory;

    renderWeightChart(updatedHistory);

    input.value = '';
    this.innerHTML = '<span class="material-symbols-outlined text-[18px] align-middle">check</span> Saved';
    setTimeout(() => { this.innerHTML = originalHTML; this.disabled = false; }, 2000);
  } catch (e) {
    console.error(e);
    U.toast("Couldn't save your weight. Please check your connection and try again.", 'error');
    this.innerHTML = originalHTML;
    this.disabled = false;
  }
});

// ── Blood details save ───────────────────────────────────────────────────────
document.getElementById('blood-submit-btn').addEventListener('click', async function() {
  const sugarRaw = document.getElementById('blood-sugar').value.trim();
  const hemoglobinRaw = document.getElementById('hemoglobin').value.trim();
  const amountRaw = document.getElementById('blood-amount').value.trim();

  if (!profileId) return;
  if (!sugarRaw && !hemoglobinRaw && !amountRaw) {
    U.toast("Please fill at least one field before saving.", 'error');
    return;
  }

  // Numeric checks only when provided — ranges cover common clinical values.
  let sugar = null, hemoglobin = null;
  if (sugarRaw) {
    sugar = Number(sugarRaw);
    if (!isFinite(sugar) || sugar < 1 || sugar > 2000) {
      U.toast("Blood sugar looks invalid. Enter a value in mg/dL (e.g. 110).", 'error');
      return;
    }
  }
  if (hemoglobinRaw) {
    hemoglobin = Number(hemoglobinRaw);
    if (!isFinite(hemoglobin) || hemoglobin < 1 || hemoglobin > 30) {
      U.toast("Hemoglobin looks invalid. Enter a value in g/dL (e.g. 13.5).", 'error');
      return;
    }
  }

  this.innerHTML = "Saving...";
  this.disabled = true;

  try {
    const newRecord = {
      date: new Date().toISOString(),
      sugar: sugar === null ? '' : String(sugar),
      hemoglobin: hemoglobin === null ? '' : String(hemoglobin),
      amount: amountRaw.slice(0, 40)
    };

    await updateDoc(doc(db, "profiles", profileId), { bloodHistory: arrayUnion(newRecord) });

    if(!currentProfileData) currentProfileData = {};
    if(!currentProfileData.bloodHistory) currentProfileData.bloodHistory = [];
    currentProfileData.bloodHistory.push(newRecord);

    this.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">check</span> Details Saved';
    setTimeout(() => { this.innerHTML = 'Save Blood Details'; this.disabled = false; }, 2000);
  } catch (e) {
    console.error(e);
    U.toast("Couldn't save blood details. Please check your connection and try again.", 'error');
    this.innerHTML = 'Save Blood Details';
    this.disabled = false;
  }
});
