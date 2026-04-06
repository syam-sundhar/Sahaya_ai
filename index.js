import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  const profilesContainer = document.getElementById('profiles-container');
  if (!profilesContainer) return;
  
  // Find the add profile button so we can insert before it
  let addCardBtn = null;
  const children = Array.from(profilesContainer.children);
  for (let i = 0; i < children.length; i++) {
      if (children[i].tagName === 'BUTTON') {
            addCardBtn = children[i];
            break;
      }
  }
  
  try {
    const q = query(collection(db, "profiles"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      const profile = doc.data();
      const card = document.createElement('div');
      card.className = "bg-[#CFECE0] p-8 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1";
      card.onclick = () => {
          sessionStorage.setItem('currentProfileId', doc.id);
          window.location.href = 'dashboard.html?id=' + doc.id;
      };
      
      let genderHtml = '';
      if (profile.gender) {
          const capitalizedGender = profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
          genderHtml = `<span class="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-md mt-2">${capitalizedGender}</span>`;
      }

      card.innerHTML = `
        <div class="avatar-glow p-1.5 rounded-full w-24 h-24 mb-4">
          <img alt="${profile.name}" class="w-full h-full object-cover rounded-full" src="${profile.photo || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdarDxE-KV2ig5BT7i5gAeOJf0EIGutWmq5I-sV9xHUI2g4KFZlpcZ9wFogbAtTksACrLZwdisiz2VeNYzLRUq9x3RxGf9sql2PUltfTct5B4OgLK3BPM9luOD7H5tvmw2embj-pzrns_Jgyi_MjGs5aZ5eet_c_Flw85mB86bR-v8-7drhUrhHBKCY9I8WJURrTpiJQH2cQhSB65iCSkwMlHZT4XT_PefL1CGOVF4t0iVMBOyE2y08Qbu27Rpid-EahsQ73Vxu0s'}"/>
        </div>
        <h3 class="font-headline font-bold text-xl text-on-primary-container leading-tight">${profile.name}</h3>
        <p class="text-on-primary-container/80 font-medium text-sm mt-1">Age: ${profile.age}</p>
        ${genderHtml}
      `;
      if (addCardBtn) {
          profilesContainer.insertBefore(card, addCardBtn);
      } else {
          profilesContainer.appendChild(card);
      }
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
  }
});
