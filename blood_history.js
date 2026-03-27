import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

const profileId = sessionStorage.getItem('currentProfileId');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  if (!profileId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const docRef = doc(db, "profiles", profileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().userId === user.uid) {
      document.getElementById('loading-state').classList.add('hidden');
      renderHistory(docSnap.data());
    } else {
      alert("Profile not found or access denied.");
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    document.getElementById('loading-state').innerText = "Failed to load.";
  }
});

function renderHistory(data) {
    let history = [];
    
    // Check for new array format
    if (data.bloodHistory && data.bloodHistory.length > 0) {
        history = [...data.bloodHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
    } else if (data.bloodDetails && (data.bloodDetails.sugar || data.bloodDetails.hemoglobin)) {
        // Fallback to old format
        history = [{
            date: new Date().toISOString(),
            sugar: data.bloodDetails.sugar,
            hemoglobin: data.bloodDetails.hemoglobin,
            amount: data.bloodDetails.amount
        }];
    }

    if (history.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }

    document.getElementById('charts-container').classList.remove('hidden');

    const labels = history.map(record => {
        const d = new Date(record.date);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const sugarData = history.map(r => parseFloat(r.sugar) || null);
    const hemoData = history.map(r => parseFloat(r.hemoglobin) || null);

    // Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { color: '#ece0de' }
            },
            x: {
                grid: { display: false }
            }
        }
    };

    // Sugar Chart
    const ctxSugar = document.getElementById('sugarChart').getContext('2d');
    new Chart(ctxSugar, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Blood Sugar',
                data: sugarData,
                borderColor: '#366759',
                backgroundColor: 'rgba(54, 103, 89, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#366759',
                pointRadius: 4
            }]
        },
        options: commonOptions
    });

    // Hemoglobin Chart
    const ctxHemo = document.getElementById('hemoglobinChart').getContext('2d');
    new Chart(ctxHemo, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hemoglobin',
                data: hemoData,
                borderColor: '#ba1a1a',
                backgroundColor: 'rgba(186, 26, 26, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ba1a1a',
                pointRadius: 4
            }]
        },
        options: commonOptions
    });
}
