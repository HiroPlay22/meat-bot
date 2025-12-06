// FILE: src/web/scripts/api.js
// Zentrale API-Wrapper

async function doFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchMe() {
  return doFetch('/api/me');
}

export async function fetchGuilds() {
  return doFetch('/api/guilds');
}

export async function fetchGuildMember(guildId) {
  return doFetch(`/api/guilds/${guildId}/me`);
}

export async function fetchGuildOverview(guildId) {
  return doFetch(`/api/guilds/${guildId}/overview`);
}

export async function fetchConsent(guildId) {
  return doFetch(`/api/guilds/${guildId}/consent`);
}

export async function updateConsent(guildId, status, version) {
  return doFetch(`/api/guilds/${guildId}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, version }),
  });
}

export async function fetchStatus() {
  return doFetch('/api/status');
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // ignore
  }
}
