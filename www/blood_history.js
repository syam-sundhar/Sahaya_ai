import { db, requireAuth } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const U = window.SAHAYA_UTIL;

// Deep-linkable: honour ?id= first, then fall back to the session hint.
let profileId = new URLSearchParams(window.location.search).get('id')
    || sessionStorage.getItem('currentProfileId');

(async () => {
    const user = await requireAuth(); // redirects to login.html when signed out

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
            U.toast("Profile not found or you don't have access to it.", 'error');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        const el = document.getElementById('loading-state');
        el.innerText = "Failed to load history. Please check your connection.";
    }
})();

function renderHistory(data) {
    let history = [];

    // Check for new array format
    if (data.bloodHistory && data.bloodHistory.length > 0) {
        history = [...data.bloodHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
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

    // Skip records whose value isn't a usable number instead of plotting gaps.
    const sugarData = history.map(r => parseFloat(r.sugar)).filter(v => isFinite(v));
    const hemoData = history.map(r => parseFloat(r.hemoglobin)).filter(v => isFinite(v));

    if (sugarData.length === 0 && hemoData.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }

    // Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: false, grid: { color: '#ece0de' } },
            x: { grid: { display: false } }
        }
    };

    if (sugarData.length > 0) {
        // eslint-disable-next-line no-new
        new Chart(document.getElementById('sugarChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels.slice(-sugarData.length),
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
    }

    if (hemoData.length > 0) {
        // eslint-disable-next-line no-new
        new Chart(document.getElementById('hemoglobinChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels.slice(-hemoData.length),
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
}
