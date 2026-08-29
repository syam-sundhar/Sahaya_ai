import { db, requireAuth } from "./auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const U = window.SAHAYA_UTIL;
const I18N = window.SAHAYA_I18N;
const Voice = window.SAHAYA_VOICE;
const t = I18N ? I18N.t.bind(I18N) : (k) => k;

const currentUser = await requireAuth();

const photoInput = document.getElementById('profile-photo-input');
const avatarPreview = document.getElementById('avatar-preview');
let photoDataUrl = '';

if (Voice) Voice.greet('add_profile_title');

function compressImage(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onerror = () => U.toast(t('error_generic'), 'error');
  reader.onload = function(event) {
    const img = new Image();
    img.onerror = () => U.toast(t('error_generic'), 'error');
    img.onload = function() {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

if (photoInput) {
  photoInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      compressImage(e.target.files[0], 500, 500, function(compressedDataUrl) {
         photoDataUrl = compressedDataUrl;
         if (avatarPreview) avatarPreview.src = photoDataUrl;
      });
    }
  });
}

const ageInput = document.getElementById('profile-age');
const ageError = document.getElementById('age-error');

function validateAge() {
  const val = Number(ageInput.value);
  if (!Number.isInteger(val) || val < 0 || val > 120) {
    ageError.textContent = t('error_generic');
    ageError.classList.remove('hidden');
    return false;
  }
  ageError.classList.add('hidden');
  return true;
}
if (ageInput) ageInput.addEventListener('input', validateAge);

const addProfileForm = document.getElementById('add-profile-form');
if (addProfileForm) {
  addProfileForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('profile-name').value.trim();
    const gender = document.getElementById('profile-gender').value;
    if (!validateAge()) {
      ageInput.focus();
      return;
    }
    const age = String(Number(ageInput.value));

    const submitBtn = document.getElementById('save-btn');
    const saveLabel = document.getElementById('save-label');
    const saveSpinner = document.getElementById('save-spinner');

    saveLabel.textContent = t('loading');
    saveSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
      await addDoc(collection(db, "profiles"), {
        userId: currentUser.uid,
        name: name,
        age: age,
        gender: gender,
        photo: photoDataUrl,
        createdAt: new Date().toISOString()
      });
      window.location.href = 'index.html';
    } catch (error) {
      console.error("Error adding document: ", error);
      U.toast(t('error_generic'), 'error');
      saveLabel.textContent = t('add_profile_btn');
      saveSpinner.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
}
