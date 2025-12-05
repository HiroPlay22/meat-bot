// FILE: src/web/scripts/profile.js
import { logout } from './api.js';
import { setLanguage, state } from './state.js';

const profileButton = document.getElementById('profile-button');
const profileDropdown = document.getElementById('profile-dropdown');
const profileName = document.getElementById('profile-name');
const profileAvatar = document.getElementById('profile-avatar');
const profileAvatarImg = document.getElementById('profile-avatar-img');
const langDe = document.getElementById('lang-de');
const langEn = document.getElementById('lang-en');
const profileLogout = document.getElementById('profile-logout');

function toggle(el) {
  if (!el) return;
  el.classList.toggle('hidden');
}

export function renderProfile(user) {
  if (!user) return;
  const displayName = user.displayName || user.username || 'User';
  if (profileName) profileName.textContent = displayName;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
  if (user.avatar && profileAvatarImg) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
    profileAvatar?.classList.add('hidden');
    profileAvatarImg.classList.remove('hidden');
    profileAvatarImg.src = avatarUrl;
    profileAvatarImg.alt = user.username;
  } else {
    profileAvatar?.classList.remove('hidden');
    if (profileAvatarImg) profileAvatarImg.classList.add('hidden');
    if (profileAvatar) profileAvatar.textContent = initial;
  }
}

function applyLanguageButtons() {
  if (langDe) {
    langDe.classList.toggle('opacity-50', state.language !== 'de');
    langDe.classList.toggle('cursor-not-allowed', state.language !== 'de');
  }
  if (langEn) {
    langEn.classList.add('opacity-50');
    langEn.classList.add('cursor-not-allowed');
  }
}

export function initProfile() {
  applyLanguageButtons();

  if (langDe) {
    langDe.addEventListener('click', (e) => {
      e.preventDefault();
      setLanguage('de');
      applyLanguageButtons();
    });
  }
  if (langEn) {
    langEn.addEventListener('click', (e) => {
      e.preventDefault();
    });
  }

  if (profileButton) {
    profileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(profileDropdown);
    });
  }

  document.addEventListener('click', (event) => {
    if (profileDropdown && !profileDropdown.contains(event.target) && !profileButton?.contains(event.target)) {
      profileDropdown.classList.add('hidden');
    }
  });

  if (profileLogout) {
    profileLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = '/';
    });
  }
}
