// FILE: src/web/scripts/dashboard.js
import { fetchGuilds, fetchMe, logout } from './api.js';
import {
  cacheGuilds,
  loadCachedGuilds,
  loadCachedSelected,
  resetState,
  setGuilds,
  setSelectedGuild,
  setUser,
  state,
} from './state.js';
import { initGuildSwitch, openGuildSelectModal, refreshGuildSwitch } from './guild-switch.js';
import { initProfile, renderProfile } from './profile.js';
import { startStatusPolling } from './status.js';

const sidebarReal = document.getElementById('sidebar-real');
const sidebarSkeleton = document.getElementById('sidebar-skeleton');
const dashboardContent = document.getElementById('dashboard-content');
const dashboardSkeleton = document.getElementById('dashboard-skeleton');
const currentGuildName = document.getElementById('current-guild-name');
const currentGuildAvatar = document.getElementById('current-guild-avatar');

function showDashboardSkeleton(showSkeleton) {
  if (dashboardSkeleton) dashboardSkeleton.classList.toggle('hidden', !showSkeleton);
  if (dashboardContent) dashboardContent.classList.toggle('hidden', showSkeleton);
  if (sidebarSkeleton) sidebarSkeleton.classList.toggle('hidden', !showSkeleton);
  if (sidebarReal) sidebarReal.classList.toggle('hidden', showSkeleton);
}

function updateGuildHeader() {
  if (!currentGuildName || !currentGuildAvatar) return;
  const guild = state.guilds.find((g) => g.id === state.selectedGuildId);
  if (!guild) {
    currentGuildName.textContent = 'Keine Guild gewählt';
    currentGuildAvatar.innerHTML = '';
    return;
  }
  currentGuildName.textContent = guild.name;
  if (guild.icon) {
    currentGuildAvatar.innerHTML = `<img src="${guild.icon}" alt="${guild.name}" class="h-7 w-7 rounded-full object-cover" />`;
  } else {
    const initial = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
    currentGuildAvatar.innerHTML = `<span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-200">${initial}</span>`;
  }
}

async function ensureGuildsLoaded() {
  if (!state.user) return;
  if (state.guilds.length) return;
  const cached = loadCachedGuilds(state.user.id);
  if (cached.length) {
    setGuilds(cached);
    refreshGuildSwitch();
    return;
  }
  const guilds = await fetchGuilds();
  setGuilds(guilds);
  cacheGuilds(state.user.id, guilds);
  refreshGuildSwitch();
}

function ensureSelectedGuild() {
  if (!state.user || !state.guilds.length) return false;
  const cached = loadCachedSelected(state.user.id);
  if (cached && state.guilds.some((g) => g.id === cached)) {
    setSelectedGuild(cached, { persist: false });
    updateGuildHeader();
    refreshGuildSwitch();
    return true;
  }
  return false;
}

async function loadSession() {
  try {
    const me = await fetchMe();
    setUser(me);
    renderProfile(me);

    await ensureGuildsLoaded();

    const hasSelection = ensureSelectedGuild();

    if (!hasSelection) {
      showDashboardSkeleton(true);
      openGuildSelectModal(() => {
        showDashboardSkeleton(false);
        refreshGuildSwitch();
      });
    } else {
      showDashboardSkeleton(false);
      refreshGuildSwitch();
    }

    // URL /dashboard
    if (window.location.pathname.endsWith('dashboard.html')) {
      window.history.replaceState({}, '', '/dashboard');
    }
  } catch (error) {
    resetState();
    await logout();
    window.location.href = '/';
  }
}

function initLogoutFallback() {
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      resetState();
      await logout();
      window.location.href = '/';
    });
  });
}

initGuildSwitch();
initProfile();
initLogoutFallback();
startStatusPolling();
showDashboardSkeleton(true);
loadSession();
