// FILE: src/web/scripts/state.js
// Zentraler State + Event-System für das Dashboard

const subscribers = new Map();

export const state = {
  authenticated: false,
  user: null,
  guilds: [],
  selectedGuildId: null,
  status: 'online',
  language: localStorage.getItem('meat_lang') || 'de',
};

function emit(event, detail) {
  const list = subscribers.get(event);
  if (!list) return;
  list.forEach((cb) => {
    try {
      cb(detail);
    } catch (err) {
      console.error('State subscriber error', err);
    }
  });
}

export function subscribe(event, cb) {
  if (!subscribers.has(event)) subscribers.set(event, []);
  subscribers.get(event).push(cb);
  return () => {
    const arr = subscribers.get(event) || [];
    subscribers.set(
      event,
      arr.filter((fn) => fn !== cb),
    );
  };
}

export function storageKeys(userId) {
  return {
    guilds: `meat_guilds_${userId}`,
    selected: `meat_selected_guild_${userId}`,
    displayNamePrefix: `meat_displayname_${userId}_`,
  };
}

export function setUser(user) {
  state.user = user;
  state.authenticated = Boolean(user);
  emit('userChanged', state.user);
}

export function setGuilds(guilds) {
  state.guilds = guilds ?? [];
  emit('guildsUpdated', state.guilds);
}

export function setSelectedGuild(guildId, { persist = true } = {}) {
  state.selectedGuildId = guildId;
  if (persist && state.user) {
    const keys = storageKeys(state.user.id);
    sessionStorage.setItem(keys.selected, guildId ?? '');
  }
  emit('guildChanged', guildId);
}

export function setStatus(status) {
  state.status = status;
  emit('statusChanged', status);
}

export function setLanguage(lang) {
  state.language = lang;
  localStorage.setItem('meat_lang', lang);
  emit('languageChanged', lang);
}

export function resetState() {
  state.authenticated = false;
  state.user = null;
  state.guilds = [];
  state.selectedGuildId = null;
  state.status = 'online';
  sessionStorage.clear();
}

export function loadCachedGuilds(userId) {
  const keys = storageKeys(userId);
  const cached = sessionStorage.getItem(keys.guilds);
  if (!cached) return [];
  try {
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function cacheGuilds(userId, guilds) {
  const keys = storageKeys(userId);
  sessionStorage.setItem(keys.guilds, JSON.stringify(guilds ?? []));
}

export function loadCachedSelected(userId) {
  const keys = storageKeys(userId);
  const val = sessionStorage.getItem(keys.selected);
  return val || null;
}

export function cacheDisplayName(userId, guildId, displayName) {
  if (!userId || !guildId) return;
  const keys = storageKeys(userId);
  sessionStorage.setItem(`${keys.displayNamePrefix}${guildId}`, displayName ?? '');
}

export function loadCachedDisplayName(userId, guildId) {
  if (!userId || !guildId) return null;
  const keys = storageKeys(userId);
  const val = sessionStorage.getItem(`${keys.displayNamePrefix}${guildId}`);
  return val || null;
}
