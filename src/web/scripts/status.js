// FILE: src/web/scripts/status.js
// Status-Polling und Badge-Update

import { fetchStatus } from './api.js';
import { setStatus, state } from './state.js';

const statusRing = document.querySelector('.status-ring');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function renderStatus(status) {
  const isOnline = status === 'online';
  const ringStatus = isOnline ? 'online' : 'offline';
  if (statusRing) statusRing.setAttribute('data-status', ringStatus);
  if (statusDot) {
    statusDot.classList.remove('bg-emerald-300', 'bg-rose-400');
    statusDot.classList.add(isOnline ? 'bg-emerald-300' : 'bg-rose-400');
  }
  if (statusText) statusText.textContent = isOnline ? 'Online' : 'Offline';
}

setStatus(state.status);
renderStatus(state.status);

export async function pollStatus() {
  try {
    const data = await fetchStatus();
    const newStatus = Boolean(data?.online ?? true) ? 'online' : 'offline';
    setStatus(newStatus);
    renderStatus(newStatus);
  } catch {
    renderStatus(state.status);
  }
}

export function startStatusPolling(intervalMs = 30_000) {
  pollStatus();
  return setInterval(pollStatus, intervalMs);
}
