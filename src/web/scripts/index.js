// FILE: src/web/scripts/index.js
import { applyLogos } from './logo.js';
import { fetchStatus } from './api.js';
import { setStatus } from './state.js';

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

async function initStatus() {
  try {
    const data = await fetchStatus();
    const status = Boolean(data?.online ?? true) ? 'online' : 'offline';
    setStatus(status);
    renderStatus(status);
  } catch {
    renderStatus('online');
  }
}

applyLogos();
initStatus();
