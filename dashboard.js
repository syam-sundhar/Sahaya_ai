import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsSMEzG_Up6pJwzBUSD8oW5VuY5XhmCuA",
  authDomain: "sahaya-ai.firebaseapp.com",
  projectId: "sahaya-ai",
  storageBucket: "sahaya-ai.firebasestorage.app",
  messagingSenderId: "648285547085",
  appId: "1:648285547085:web:756f7440911378888eca04",
  measurementId: "G-FQ3F0N3HE0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
let profileId = urlParams.get('id');

if (!profileId) {
  profileId = sessionStorage.getItem('currentProfileId');
  if (profileId) {
     const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + profileId;
     window.history.replaceState({path:newurl}, '', newurl);
  } else {
     window.location.href = 'index.html';
  }
} else {
  sessionStorage.setItem('currentProfileId', profileId);
}

let currentProfileData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const docRef = doc(db, "profiles", profileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().userId === user.uid) {
      currentProfileData = docSnap.data();
      populateProfileUI(currentProfileData);
    } else {
      alert("Profile not found or access denied.");
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    alert("Error loading profile");
  }
});

function populateProfileUI(data) {
  // Basic Details
  const photoUrl = data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=366759&color=fff`;
  sessionStorage.setItem('currentProfilePhoto', photoUrl);
  
  document.getElementById('header-profile-img').src = photoUrl;
  document.getElementById('main-profile-img').src = photoUrl;
  document.getElementById('main-profile-name').innerText = data.name || 'Unknown';
  document.getElementById('main-profile-age').innerText = `Age: ${data.age || 'N/A'}`;
  
  // Show Gender
  if (data.gender) {
      const genderItem = document.getElementById('main-profile-gender');
      genderItem.style.display = 'inline-block';
      genderItem.innerText = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
  }

  // Blood Details Pre-fill (latest off history or legacy bloodDetails array)
  if (data.bloodHistory && data.bloodHistory.length > 0) {
      // Sort by date descending
      const sortedHistory = [...data.bloodHistory].sort((a,b) => new Date(b.date) - new Date(a.date));
      const latest = sortedHistory[0];
      fillBloodInputs(latest);
  } else if (data.bloodDetails) {
      // Legacy support before we added bloodHistory
      fillBloodInputs(data.bloodDetails);
  }

  // Weight tracking
  const weightHistory = data.weightHistory || {}; // { 'YYYY-MM': weight }
  renderWeightChart(weightHistory);
}

function fillBloodInputs(record) {
    document.getElementById('blood-sugar').value = record.sugar || '';
    document.getElementById('hemoglobin').value = record.hemoglobin || '';
    document.getElementById('blood-amount').value = record.amount || '';
}

function renderWeightChart(weightHistory) {
    const chartContainer = document.getElementById('weight-chart-container');
    chartContainer.innerHTML = ''; // clear

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    
    let maxWeight = 100;
    let latestWeight = '--';
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const yKey = past.getFullYear();
        const mKey = String(past.getMonth() + 1).padStart(2, '0');
        const key = `${yKey}-${mKey}`;
        
        let weight = weightHistory[key] || 0;
        if (weight > maxWeight) maxWeight = weight + 20;

        if (i === 0 && weight) {
            latestWeight = weight;
        } else if (!latestWeight || latestWeight === '--') {
            if (weight) latestWeight = weight; // get most recent if current month missing
        }

        last6Months.push({
            key: key,
            monthLabel: monthNames[past.getMonth()],
            weight: weight,
            isCurrent: i === 0
        });
    }

    document.getElementById('current-weight-display').innerHTML = `${latestWeight}<span class="text-sm font-bold text-primary/70 ml-1">kg</span>`;

    last6Months.forEach(m => {
        const barHeight = m.weight ? Math.max((m.weight / maxWeight) * 100, 10) : 5; // min 5% height

        const div = document.createElement('div');
        div.className = "flex flex-col items-center gap-2 w-full";
        div.innerHTML = `
          <div class="w-full bg-surface-dim rounded-t-xl relative h-24 flex items-end justify-center group">
            <div class="w-full ${m.isCurrent ? 'bg-primary' : 'bg-primary/50'} rounded-t-xl transition-all duration-300 ${m.isCurrent ? 'hover:bg-primary/90' : 'hover:bg-primary'} cursor-pointer" style="height: ${barHeight}%"></div>
            <span class="absolute -top-6 text-[10px] font-bold ${m.isCurrent ? 'text-primary' : 'text-on-surface-variant'} opacity-0 group-hover:opacity-100 transition-opacity">${m.weight ? m.weight + 'kg' : 'N/A'}</span>
          </div>
          <span class="text-[10px] ${m.isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}">${m.monthLabel}</span>
        `;
        chartContainer.appendChild(div);
    });
}

document.getElementById('weight-submit-btn').addEventListener('click', async function() {
  const input = document.getElementById('weight-input');
  const val = parseFloat(input.value);
  if (!val || !profileId) return;

  const originalText = this.innerHTML;
  this.innerHTML = "Saving...";
  this.disabled = true;

  try {
    const d = new Date();
    const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const updatedHistory = { ...(currentProfileData?.weightHistory || {}) };
    updatedHistory[currentMonthKey] = val;

    await updateDoc(doc(db, "profiles", profileId), {
        weightHistory: updatedHistory
    });

    // Update local state
    if(!currentProfileData) currentProfileData = {};
    currentProfileData.weightHistory = updatedHistory;
    
    renderWeightChart(updatedHistory);
    
    input.value = '';
    this.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Saved';
    setTimeout(() => {
        this.innerHTML = 'Update';
        this.disabled = false;
    }, 2000);
  } catch (e) {
    console.error(e);
    alert("Error saving weight");
    this.innerHTML = 'Update';
    this.disabled = false;
  }
});

document.getElementById('blood-submit-btn').addEventListener('click', async function() {
  const sugar = document.getElementById('blood-sugar').value;
  const hemoglobin = document.getElementById('hemoglobin').value;
  const amount = document.getElementById('blood-amount').value;

  if (!profileId) return;

  this.innerHTML = "Saving...";
  this.disabled = true;

  try {
    const newRecord = {
      date: new Date().toISOString(),
      sugar: sugar,
      hemoglobin: hemoglobin,
      amount: amount
    };

    await updateDoc(doc(db, "profiles", profileId), {
      bloodHistory: arrayUnion(newRecord)
    });

    // Update local state
    if(!currentProfileData) currentProfileData = {};
    if(!currentProfileData.bloodHistory) currentProfileData.bloodHistory = [];
    currentProfileData.bloodHistory.push(newRecord);

    this.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">check</span> Details Saved';
    setTimeout(() => {
        this.innerHTML = 'Save Blood Details';
        this.disabled = false;
    }, 2000);
  } catch (e) {
    console.error(e);
    alert("Error saving blood details");
    this.innerHTML = 'Save Blood Details';
    this.disabled = false;
  }
});
