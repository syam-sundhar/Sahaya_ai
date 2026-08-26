import { auth, db, requireAuth, logout } from "./auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const U = window.SAHAYA_UTIL;

// Log out button (header)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    await logout();
  });
}

(async () => {
  const user = await requireAuth(); // redirects to login.html when signed out
  if (!user) return;

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

    if (querySnapshot.empty) {
      const empty = document.createElement('p');
      empty.className = "text-center text-on-surface-variant font-medium";
      empty.textContent = "No profiles yet. Create one to get started.";
      profilesContainer.insertBefore(empty, addCardBtn);
    }

    querySnapshot.forEach((doc) => {
      const profile = doc.data();
      const card = document.createElement('div');
      card.className = "bg-[#CFECE0] p-8 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1";
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.onclick = () => {
          sessionStorage.setItem('currentProfileId', doc.id);
          window.location.href = 'dashboard.html?id=' + encodeURIComponent(doc.id);
      };
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.onclick(); }
      });

      let genderHtml = '';
      if (profile.gender) {
          const capitalizedGender = profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
          genderHtml = `<span class="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-md mt-2">${U.escapeHtml(capitalizedGender)}</span>`;
      }

      // XSS-safe: all user data escaped; avatar is a local SVG data-URI fallback.
      card.innerHTML = `
        <div class="avatar-glow p-1.5 rounded-full w-24 h-24 mb-4">
          <img alt="${U.escapeHtml(profile.name || 'Profile')}" class="w-full h-full object-cover rounded-full" src="${U.escapeHtml(U.profilePhoto(profile))}"/>
        </div>
        <h3 class="font-headline font-bold text-xl text-on-primary-container leading-tight">${U.escapeHtml(profile.name)}</h3>
        <p class="text-on-primary-container/80 font-medium text-sm mt-1">Age: ${U.escapeHtml(profile.age)}</p>
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
    U.toast("Could not load profiles. Please check your connection.", 'error');
  }
})();
