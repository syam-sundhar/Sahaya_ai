import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

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
const storage = getStorage(app);

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
      
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.style.display = 'none';
      
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
  // Store context for AI use
  localStorage.setItem('sahaya_health_context', JSON.stringify(data));
  
  // Basic Details
  const photoUrl = data.photo || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdarDxE-KV2ig5BT7i5gAeOJf0EIGutWmq5I-sV9xHUI2g4KFZlpcZ9wFogbAtTksACrLZwdisiz2VeNYzLRUq9x3RxGf9sql2PUltfTct5B4OgLK3BPM9luOD7H5tvmw2embj-pzrns_Jgyi_MjGs5aZ5eet_c_Flw85mB86bR-v8-7drhUrhHBKCY9I8WJURrTpiJQH2cQhSB65iCSkwMlHZT4XT_PefL1CGOVF4t0iVMBOyE2y08Qbu27Rpid-EahsQ73Vxu0s';
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
      renderBloodChart(sortedHistory);
  } else if (data.bloodDetails) {
      // Legacy support before we added bloodHistory
      fillBloodInputs(data.bloodDetails);
  }

  // Weight tracking
  const weightHistory = data.weightHistory || {}; // { 'YYYY-MM': weight }
  renderWeightChart(weightHistory);
  
  // Medical Files
  const medicalFiles = data.medicalFiles || [];
  renderMedicalFiles(medicalFiles);
}

function renderBloodChart(bloodHistory) {
    const chartContainer = document.getElementById('blood-chart-container');
    if (!chartContainer) return;
    
    if (!bloodHistory || bloodHistory.length === 0) {
        chartContainer.innerHTML = '';
        return;
    }
    
    const latest = bloodHistory[0];
    
    // sugar (normal is < 140, max ~300)
    const sugarVal = parseFloat(latest.sugar) || 0;
    const sugarPct = Math.min((sugarVal / 300) * 100, 100);
    // hb (normal 12-16, max ~20)
    const hbVal = parseFloat(latest.hemoglobin) || 0;
    const hbPct = Math.min((hbVal / 20) * 100, 100);
    
    chartContainer.innerHTML = `
        <div class="flex flex-col gap-1">
            <div class="flex justify-between text-xs font-bold">
                <span class="text-on-surface">Blood Sugar</span>
                <span class="text-primary">${latest.sugar||'--'} <span class="opacity-70 text-[10px]">mg/dL</span></span>
            </div>
            <div class="w-full h-2 bg-surface-dim rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#BFF5F5] to-[#7CAE9E] rounded-full" style="width: ${sugarPct}%"></div>
            </div>
        </div>
        <div class="flex flex-col gap-1 mt-2">
            <div class="flex justify-between text-xs font-bold">
                <span class="text-on-surface">Hemoglobin</span>
                <span class="text-[#ba1a1a]">${latest.hemoglobin||'--'} <span class="opacity-70 text-[10px]">g/dL</span></span>
            </div>
            <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#FFDAD6] to-[#ba1a1a] rounded-full shadow-sm" style="width: ${hbPct}%"></div>
            </div>
        </div>
    `;
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
    
    const sortedHistory = [...currentProfileData.bloodHistory].sort((a,b) => new Date(b.date) - new Date(a.date));
    renderBloodChart(sortedHistory);

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

// Medical Files Logic
const addMedicalFileBtn = document.getElementById('add-medical-file-btn');
const medicalFileInput = document.getElementById('medical-file-input');
const medicalFilesContainer = document.getElementById('medical-files-container');

addMedicalFileBtn.addEventListener('click', () => {
    medicalFileInput.click();
});

medicalFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !profileId) return;

    let fileName = prompt("Enter a name for this record:", file.name);
    if (fileName === null) {
        medicalFileInput.value = ''; // cancelled
        return;
    }
    if (fileName.trim() === '') fileName = file.name;

    const originalBtnHtml = addMedicalFileBtn.innerHTML;
    addMedicalFileBtn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Uploading';
    addMedicalFileBtn.disabled = true;

    try {
        const fileRef = ref(storage, `profiles/${profileId}/medical_files/${Date.now()}_${file.name}`);
        
        // Add a 10 second timeout in case Firebase Storage bucket is not initialized
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), 10000));
        await Promise.race([uploadBytes(fileRef, file), timeoutPromise]);
        
        const url = await getDownloadURL(fileRef);

        const newFileRecord = {
            name: fileName,
            url: url,
            date: new Date().toISOString(),
            type: file.type
        };

        await updateDoc(doc(db, "profiles", profileId), {
            medicalFiles: arrayUnion(newFileRecord)
        });

        if(!currentProfileData) currentProfileData = {};
        if(!currentProfileData.medicalFiles) currentProfileData.medicalFiles = [];
        currentProfileData.medicalFiles.push(newFileRecord);
        
        renderMedicalFiles(currentProfileData.medicalFiles);

        addMedicalFileBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span> Added';
        setTimeout(() => {
            addMedicalFileBtn.innerHTML = originalBtnHtml;
            addMedicalFileBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Error uploading file:", error);
        if (error.message === "UPLOAD_TIMEOUT") {
             alert("Upload timed out! Please ensure you have clicked 'Get Started' under Firebase Storage in the Firebase Console and your Storage Rules allow uploads.");
        } else {
             alert("Failed to upload the file to cloud storage.");
        }
        addMedicalFileBtn.innerHTML = originalBtnHtml;
        addMedicalFileBtn.disabled = false;
    } finally {
        medicalFileInput.value = ''; // Reset input
    }
});

function renderMedicalFiles(files) {
    if (!files || files.length === 0) {
        medicalFilesContainer.innerHTML = '<div class="text-xs font-medium text-on-surface-variant text-center py-4">No files added yet.</div>';
        return;
    }

    // Sort files by date descending
    const sortedFiles = [...files].sort((a, b) => new Date(b.date) - new Date(a.date));

    medicalFilesContainer.innerHTML = '';
    sortedFiles.forEach(f => {
        let icon = "draft";
        if (f.type.includes('pdf')) icon = "picture_as_pdf";
        else if (f.type.includes('image')) icon = "image";
        
        const d = new Date(f.date);
        const dateStr = d.toLocaleDateString();

        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-surface-container rounded-xl p-3 border border-outline-variant/30";
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary">${icon}</span>
                </div>
                <div class="min-w-0">
                    <h5 class="text-sm font-bold text-on-surface truncate">${f.name}</h5>
                    <p class="text-[10px] text-on-surface-variant">${dateStr}</p>
                </div>
            </div>
            <a href="${f.url}" target="_blank" class="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center shrink-0" title="View File">
                <span class="material-symbols-outlined">visibility</span>
            </a>
        `;
        medicalFilesContainer.appendChild(div);
    });
}

