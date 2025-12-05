// FILE: src/web/scripts/dashboard.js
import { fetchGuilds, fetchGuildMember, fetchMe, logout } from './api.js';
import {
  cacheGuilds,
  loadCachedGuilds,
  loadCachedSelected,
  resetState,
  setGuilds,
  setSelectedGuild,
  setUser,
  state,
  subscribe,
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
const navProfileLabel = document.getElementById('nav-profile-label');
const headerGuildTitle = document.getElementById('header-guild-title');
const heroGuildTitle = document.getElementById('hero-guild-title');
const heroUserName = document.getElementById('hero-user-name');
const profileCardTitle = document.getElementById('card-profile-title');
const userRoleBadge = document.getElementById('user-role-badge');

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
    currentGuildName.textContent = 'Keine Guild gewaehlt';
    currentGuildAvatar.innerHTML = '';
    if (headerGuildTitle) headerGuildTitle.textContent = 'Control Center';
    if (heroGuildTitle) heroGuildTitle.textContent = 'Control Center';
    return;
  }
  currentGuildName.textContent = guild.name;
  if (headerGuildTitle) headerGuildTitle.textContent = `${guild.name} Control Center`;
  if (heroGuildTitle) heroGuildTitle.textContent = `${guild.name} Control Center`;
  if (guild.icon) {
    currentGuildAvatar.innerHTML = `<img src="${guild.icon}" alt="${guild.name}" class="h-7 w-7 rounded-full object-cover" />`;
  } else {
    const initial = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
    currentGuildAvatar.innerHTML = `<span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-200">${initial}</span>`;
  }
}

function applyUserDisplayName(displayName) {
  const label = displayName || 'User';
  if (heroUserName) heroUserName.textContent = label;
  if (profileCardTitle) profileCardTitle.textContent = `Profil @${label}`;
}

function updateUserRoleBadge(role) {
  if (!userRoleBadge) return;
  if (!role) {
    userRoleBadge.innerHTML = '<span class="inline-flex h-1.5 w-1.5 rounded-full bg-slate-500"></span>Rolle unbekannt';
    return;
  }
  const color = role.color != null ? `#${role.color.toString(16).padStart(6, '0')}` : null;
  const dotStyle = color ? `style="background:${color}"` : '';
  userRoleBadge.innerHTML = `<span class="inline-flex h-1.5 w-1.5 rounded-full" ${dotStyle}></span>${role.name}`;
}

function setupDropdownExclusivity() {
  const guildMenu = document.getElementById('guild-switch-menu');
  const profileMenu = document.getElementById('profile-dropdown');
  const guildBtn = document.getElementById('guild-switch-button');
  const profileBtn = document.getElementById('profile-button');

  if (guildBtn) {
    guildBtn.addEventListener('click', () => {
      if (profileMenu) profileMenu.classList.add('hidden');
    });
  }
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (guildMenu) guildMenu.classList.add('hidden');
    });
  }
}

async function loadGuildMemberData() {
  if (!state.selectedGuildId) return;
  try {
    const data = await fetchGuildMember(state.selectedGuildId);
    const displayName = data?.member?.displayName || state.user?.displayName || state.user?.username || 'User';
    applyUserDisplayName(displayName);
    updateUserRoleBadge(data?.highestRoleResolved || null);
  } catch (error) {
    updateUserRoleBadge(null);
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
    const displayName = me?.displayName || me?.username || 'User';
    setUser({ ...me, displayName });
    renderProfile({ ...me, displayName });
    applyUserDisplayName(displayName);
    updateUserRoleBadge(null);

    if (navProfileLabel) {
      const possessive = /[sS]$/.test(displayName) ? `${displayName}' Profil` : `${displayName}'s Profil`;
      navProfileLabel.textContent = possessive;
    }

    await ensureGuildsLoaded();

    const hasSelection = ensureSelectedGuild();

    if (!hasSelection) {
      showDashboardSkeleton(true);
      openGuildSelectModal(() => {
        showDashboardSkeleton(false);
        refreshGuildSwitch();
        loadGuildMemberData();
      });
    } else {
      showDashboardSkeleton(false);
      refreshGuildSwitch();
      loadGuildMemberData();
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
setupDropdownExclusivity();
subscribe('guildChanged', () => {
  updateGuildHeader();
  loadGuildMemberData();
});
loadSession();
