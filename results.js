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

// For download button
window.downloadReport = function() {
    alert('Downloading your report...');
    // Real implementation would use jsPDF or similar
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return; // handle unauthenticated gracefully or redirect
    }

    let profileId = sessionStorage.getItem('currentProfileId');
    if (!profileId) {
        return;
    }

    const docRef = doc(db, "profiles", profileId);

    // 1. Check if we have a fresh result to save to Firebase
    const recentResultStr = localStorage.getItem('sahaya_assessment_result');
    if (recentResultStr) {
        const result = JSON.parse(recentResultStr);
        // Only save if it's recently generated (we use a flag to prevent duplicate saving)
        if (!result.savedToCloud) {
            try {
                const historyItem = {
                    date: new Date().toISOString(),
                    riskLevel: result.riskLevel,
                    summary: result.summary,
                    content: result.content,
                    chatLog: result.chatLog || []
                };
                
                await updateDoc(docRef, {
                    assessmentHistory: arrayUnion(historyItem)
                });
                
                result.savedToCloud = true;
                localStorage.setItem('sahaya_assessment_result', JSON.stringify(result));
                console.log("Saved new assessment to cloud history.");
            } catch (e) {
                console.error("Error saving assessment to cloud", e);
            }
        }
    }

    // 2. Load Assessment History for the Tab
    window.allHistoricalChats = {}; // map date to chatLog
    fetchAndDisplayHistory(docRef);
});

// Helper for History View Chat
window.viewHistoricalChat = function(dateStr) {
    const log = window.allHistoricalChats[dateStr];
    if(log) {
        window.renderChatLogToModal(log);
        document.getElementById('chat-modal').classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('chat-modal-content');
            if(content) content.scrollTop = content.scrollHeight;
        }, 50);
    }
};

window.downloadHistoricalReport = function(id) {
    window.downloadReportAsPDF(id);
};

async function fetchAndDisplayHistory(docRef) {
    const listContainer = document.getElementById('history-list-container');
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            const history = data.assessmentHistory || [];
            
            if (history.length === 0) {
                listContainer.innerHTML = '<p class="text-on-surface-variant text-center my-10 font-medium">No previous assessments found.</p>';
                return;
            }
            
            // sort descending
            history.sort((a,b) => new Date(b.date) - new Date(a.date));
            
            listContainer.innerHTML = '';
            history.forEach(item => {
                const dateObj = new Date(item.date);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                let colorClass = "text-[#366759]";
                let bgClass = "bg-[#CFECE0]/40";
                let iconClass = "text-[#366759]";
                let iconName = "health_and_safety";
                
                if (item.riskLevel.toLowerCase() === 'high') {
                    colorClass = "text-[#ba1a1a]";
                    bgClass = "bg-[#FFDAD6]";
                    iconClass = "text-[#ba1a1a]";
                    iconName = "e911_emergency";
                } else if (item.riskLevel.toLowerCase() === 'moderate') {
                    colorClass = "text-[#815248]";
                    bgClass = "bg-[#FEC0B3]";
                    iconClass = "text-[#815248]";
                    iconName = "warning";
                }

                const divId = `history-report-${item.date.replace(/[:.\-]/g, '')}`;
                
                // Cache the chat log locally for the modal
                window.allHistoricalChats[item.date] = item.chatLog || [];

                const div = document.createElement('div');
                div.className = "bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm flex flex-col";
                div.innerHTML = `
                    <div id="${divId}" class="p-5">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-xs font-bold text-on-surface-variant">${dateStr} at ${timeStr}</span>
                            <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${bgClass} ${colorClass}">${item.riskLevel}</span>
                        </div>
                        <h4 class="font-headline font-bold text-on-surface text-lg mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined ${colorClass}">${iconName}</span>
                            ${item.summary}
                        </h4>
                        <p class="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-4">${item.content.replace(/\*\*/g, '')}</p>
                    </div>
                    <div class="bg-surface-container-low px-4 py-3 border-t border-outline-variant/30 rounded-b-xl flex justify-end gap-3">
                        <button onclick="downloadHistoricalReport('${divId}')" class="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-white border border-outline-variant/30 text-on-surface px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-surface-dim transition-colors">
                            <span class="material-symbols-outlined text-[16px]">download</span> PDF
                        </button>
                        <button onclick="viewHistoricalChat('${item.date}')" class="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-[#366759]/10 text-[#366759] hover:bg-[#366759]/20 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-[16px]">chat</span> Chat
                        </button>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        }
    } catch(e) {
        console.error(e);
        listContainer.innerHTML = '<p class="text-error text-center my-10 font-bold">Failed to load history.</p>';
    }
}
