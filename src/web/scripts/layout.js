// FILE: src/web/scripts/layout.js
import { fetchGuilds, fetchMe, logout } from './api.js';
import {
  cacheGuilds,
  loadCachedGuilds,
  loadCachedDisplayName,
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

const headerGuildTitle = document.getElementById('header-guild-title');
const heroGuildTitle = document.getElementById('hero-guild-title');
const navProfileLabel = document.getElementById('nav-profile-label');
const pageContent = document.getElementById('page-content');

if (pageContent) {
  pageContent.classList.add('opacity-0', 'pointer-events-none', 'transition-opacity', 'duration-200');
}

function setNavProfile(displayName) {
  if (navProfileLabel) {
    const possessive = /[sS]$/.test(displayName) ? `${displayName}' Profil` : `${displayName}'s Profil`;
    navProfileLabel.textContent = possessive;
  }
}

function updateGuildHeader() {
  const guild = state.guilds.find((g) => g.id === state.selectedGuildId);
  const title = guild?.name ? `${guild.name} Control Center` : 'Control Center';
  if (headerGuildTitle) headerGuildTitle.textContent = title;
  if (heroGuildTitle) heroGuildTitle.textContent = title;
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

function applyCachedDisplayName() {
  if (!state.user || !state.selectedGuildId) return;
  const cached = loadCachedDisplayName(state.user.id, state.selectedGuildId);
  if (cached) {
    const updated = { ...state.user, displayName: cached };
    setUser(updated);
    renderProfile(updated);
    setNavProfile(cached);
  }
}

function ensureSelectedGuild() {
  if (!state.user || !state.guilds.length) return false;

  if (state.selectedGuildId && state.guilds.some((g) => g.id === state.selectedGuildId)) {
    return true;
  }

  const cached = loadCachedSelected(state.user.id);
  if (cached && state.guilds.some((g) => g.id === cached)) {
    setSelectedGuild(cached, { persist: false });
    return true;
  }

  if (state.guilds.length === 1) {
    setSelectedGuild(state.guilds[0].id);
    return true;
  }

  return false;
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

export async function bootstrapLayout({ onGuildChanged } = {}) {
  initGuildSwitch();
  initProfile();
  initLogoutFallback();
  startStatusPolling();

  try {
    const me = await fetchMe();
    const displayName = me?.displayName || me?.username || 'User';
    setUser({ ...me, displayName });
    renderProfile({ ...me, displayName });
    setNavProfile(displayName);

    await ensureGuildsLoaded();
    const hasSelection = ensureSelectedGuild();

    const proceed = async () => {
      applyCachedDisplayName();
      updateGuildHeader();
      refreshGuildSwitch();
      if (onGuildChanged && state.selectedGuildId) {
        await onGuildChanged(state.selectedGuildId);
      }
      if (pageContent) {
        pageContent.classList.remove('opacity-0', 'pointer-events-none');
        pageContent.classList.add('opacity-100');
      }
    };

    if (!hasSelection) {
      openGuildSelectModal(async () => {
        await proceed();
      });
    } else {
      await proceed();
    }

    if (window.location.pathname.endsWith('dashboard.html')) {
      window.history.replaceState({}, '', '/dashboard.html');
    }
  } catch (error) {
    resetState();
    await logout();
    window.location.href = '/';
  }

  subscribe('guildChanged', async () => {
    updateGuildHeader();
    if (onGuildChanged && state.selectedGuildId) {
      await onGuildChanged(state.selectedGuildId);
    }
  });
}

// Auto-bootstrap on non-dashboard pages that only need header/sidebar.
if (!window.location.pathname.includes('dashboard')) {
  bootstrapLayout().catch(() => {
    // handled in bootstrap
  });
}

