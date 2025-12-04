// Minimaler Auth- und UI-Loader für die statische Preview

const state = {
  authenticated: false,
  user: null,
  guilds: [],
};

const userChip = document.getElementById('user-chip');
const userName = document.getElementById('user-name');
const userTag = document.getElementById('user-tag');
const logoutButton = document.getElementById('logout-button');
const logoutButtonSecondary = document.getElementById('logout-button-secondary');
const guildHint = document.getElementById('guild-hint');
const guildList = document.getElementById('guild-list');
const dashboardCards = document.getElementById('dashboard-cards');
const lockedDashboardHint = document.getElementById('locked-dashboard-hint');
const authOnlyElements = document.querySelectorAll('[data-requires-auth]');
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const logoTargets = document.querySelectorAll('[data-logo-target]');
const statusRing = document.querySelector('.status-ring');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const sidebar = document.querySelector('[data-sidebar]');
const sidebarToggle = document.getElementById('sidebar-toggle');
const isDashboardPage = window.location.pathname.includes('dashboard');
const dashboardContent = document.getElementById('dashboard-content');
const dashboardSkeleton = document.getElementById('dashboard-skeleton');
const guildModal = document.getElementById('guild-modal');
const guildModalList = document.getElementById('guild-modal-list');
const guildModalClose = document.getElementById('guild-modal-close');

const logoConfig = (() => {
  const now = new Date();
  const isDecember = now.getMonth() === 11;
  return {
    candidates: isDecember
      ? [
          { type: 'video', url: 'assets/logo/meat_logo_xmas_ani.webm' },
          { type: 'image', url: 'assets/logo/meat_logo_xmas.png' },
          { type: 'image', url: 'assets/logo/meat_logo.png' },
        ]
      : [
          { type: 'video', url: 'assets/logo/meat_logo_ani.webm' }, // optional, falls später vorhanden
          { type: 'image', url: 'assets/logo/meat_logo.png' },
        ],
  };
})();

async function applyLogos() {
  if (!logoTargets.length) return;

  const firstImage = logoConfig.candidates.find((c) => c.type === 'image');
  const firstVideo = logoConfig.candidates.find((c) => c.type === 'video');

  // Helper: set all logo targets to a given image URL
  const setImage = (url) => {
    logoTargets.forEach((el) => {
      if (el.tagName.toLowerCase() === 'img') {
        el.setAttribute('src', url);
      } else if (el.tagName.toLowerCase() === 'video') {
        const img = document.createElement('img');
        img.src = url;
        img.className = el.className;
        img.dataset.logoTarget = 'true';
        img.alt = el.getAttribute('aria-label') ?? 'M.E.A.T. Logo';
        el.replaceWith(img);
      }
    });
  };

  // Helper: try to load video; resolve true if playable
  const tryVideo = (url) =>
    new Promise((resolve) => {
      if (!url) return resolve(false);
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.oncanplaythrough = () => resolve(true);
      video.onerror = () => resolve(false);
      video.src = url;
    });

  // Set initial fallback image immediately
  if (firstImage) {
    setImage(firstImage.url);
  }

  // If we have a video candidate, try it and swap in if playable
  if (firstVideo) {
    const playable = await tryVideo(firstVideo.url);
    if (playable) {
      logoTargets.forEach((el) => {
        if (el.tagName.toLowerCase() === 'img') {
          const video = document.createElement('video');
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.className = el.className;
          video.dataset.logoTarget = 'true';
          const source = document.createElement('source');
          source.src = firstVideo.url;
          source.type = 'video/webm';
          video.appendChild(source);
          video.setAttribute('aria-label', el.getAttribute('alt') ?? 'M.E.A.T. Logo');
          el.replaceWith(video);
        }
      });
    }
  }
}
function render() {
  authOnlyElements.forEach((el) => {
    if (state.authenticated) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  if (dashboardCards) dashboardCards.classList.toggle('hidden', !state.authenticated);
  if (lockedDashboardHint) lockedDashboardHint.classList.toggle('hidden', state.authenticated);

  if (!isDashboardPage) {
    if (loginView) loginView.classList.toggle('hidden', state.authenticated);
    if (dashboardView) dashboardView.classList.toggle('hidden', !state.authenticated);
  }

  if (userChip && userName && userTag) {
    if (state.authenticated && state.user) {
      userName.textContent = state.user.username ?? 'User';
      userTag.textContent = state.user.discriminator ? '#' + state.user.discriminator : '';
      userChip.classList.remove('hidden');
    } else {
      userChip.classList.add('hidden');
    }
  }

  if (logoutButton) {
    logoutButton.classList.toggle('hidden', !state.authenticated);
  }
  if (logoutButtonSecondary) {
    logoutButtonSecondary.classList.toggle('hidden', !state.authenticated);
  }

  renderGuilds();
}

function renderGuilds() {
  if (!guildList) return;
  guildList.innerHTML = '';

  if (!state.authenticated) {
    if (guildHint) guildHint.textContent = 'Login erforderlich';
    return;
  }

  const guilds = state.guilds.length ? state.guilds : [];

  if (guildHint) guildHint.textContent = guilds.length ? 'Server gefunden' : 'Keine Server gefunden';

  if (guilds.length === 0) {
    guildList.innerHTML =
      '<p class="text-xs text-slate-500">Keine Server gefunden. Stelle sicher, dass der Bot installiert ist und du Admin/Owner bist.</p>';
    return;
  }

  guilds.forEach((guild) => {
    const initial = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
    const card = document.createElement('article');
    card.className =
      'rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-rose-500 transition flex flex-col gap-3';

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
          ${
            guild.icon
              ? `<img src="${guild.icon}" alt="${guild.name}" class="h-10 w-10 object-cover" />`
              : `<span class="text-lg text-slate-400">${initial}</span>`
          }
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-100">${guild.name}</p>
          <p class="text-[0.7rem] text-slate-500">${guild.owner ? 'Owner/Admin' : 'Berechtigt'}</p>
        </div>
      </div>
      <button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 hover:border-rose-500 hover:text-rose-100 transition">
        <span>Öffnen</span>
        <span class="text-lg">→</span>
      </button>
    `;

    guildList.appendChild(card);
  });
}

function pushDashboardUrl() {
  if (window.location.pathname.endsWith('dashboard.html')) {
    window.history.replaceState({}, '', '/dashboard');
  }
}

function showGuildModal() {
  if (!guildModal || !guildModalList) return;
  guildModal.classList.remove('hidden');
  guildModal.classList.add('flex');
  guildModalList.innerHTML = '';
  if (!state.guilds.length) {
    guildModalList.innerHTML =
      '<div class="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">Keine Server gefunden. Stelle sicher, dass du Admin/Owner bist und der Bot freigeschaltet ist.</div>';
    return;
  }
  state.guilds.forEach((guild) => {
    // nur zeigen, wenn der Bot wirklich auf der Guild ist
    if (guild.botPresent === false) return;
    const card = document.createElement('button');
    card.type = 'button';
    card.className =
      'w-full text-left rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-rose-500 hover:text-rose-100 transition';
    const initial = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
          ${
            guild.icon
              ? `<img src="${guild.icon}" alt="${guild.name}" class="h-10 w-10 object-cover" />`
              : `<span class="text-lg text-slate-400">${initial}</span>`
          }
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-100">${guild.name}</p>
          <p class="text-[0.7rem] text-slate-500">${guild.owner ? 'Owner/Admin' : 'Berechtigt'}</p>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      guildModal.classList.add('hidden');
      guildModal.classList.remove('flex');
      if (dashboardSkeleton) dashboardSkeleton.classList.add('hidden');
      if (dashboardContent) dashboardContent.classList.remove('hidden');
    });
    guildModalList.appendChild(card);
  });
}

function setStatusBadge(status = 'online') {
  const isOnline = status === 'online';
  const ringStatus = isOnline ? 'online' : 'offline';
  if (statusRing) statusRing.setAttribute('data-status', ringStatus);
  if (statusDot) {
    statusDot.classList.remove('bg-emerald-300', 'bg-rose-400');
    statusDot.classList.add(isOnline ? 'bg-emerald-300' : 'bg-rose-400');
  }
  if (statusText) statusText.textContent = isOnline ? 'Online' : 'Offline';
}

async function loadSession() {
  try {
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (!meRes.ok) throw new Error('no session');
    state.user = await meRes.json();
    state.authenticated = true;

    const guildRes = await fetch('/api/guilds', { credentials: 'include' });
    if (guildRes.ok) state.guilds = await guildRes.json();

    if (!isDashboardPage) {
      const main = document.querySelector('main');
      if (main) {
        main.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 200);
      } else {
        window.location.href = '/dashboard.html';
      }
      return;
    }
  } catch {
    state.authenticated = false;
    state.user = null;
    state.guilds = [];

    if (isDashboardPage) {
      window.location.href = '/';
      return;
    }
  }

  render();
  if (isDashboardPage) {
    pushDashboardUrl();
    showGuildModal();
  }
}

async function loadCommits() {
  const list = document.getElementById('git-commits');
  if (!list) return;

  try {
    const res = await fetch('https://api.github.com/repos/HiroPlay22/meat-bot/commits?sha=main&per_page=5');
    if (!res.ok) throw new Error('GitHub API Error: ' + res.status);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<li class="text-[0.75rem] text-slate-500">Keine Commits gefunden.</li>';
      return;
    }

    list.innerHTML = '';

    data.forEach((commit) => {
      const li = document.createElement('li');
      li.className = 'flex items-start justify-between gap-3';

      const message =
        (commit.commit && commit.commit.message ? commit.commit.message.split('\n')[0] : 'No message') || 'No message';
      const sha = commit.sha ? commit.sha.slice(0, 7) : '';
      const url = commit.html_url || '#';
      const date =
        commit.commit && commit.commit.author && commit.commit.author.date
          ? new Date(commit.commit.author.date)
          : null;

      const formattedDate = date
        ? date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      li.innerHTML = `
        <div class="space-y-0.5">
          <p class="text-[0.78rem] text-slate-200 truncate max-w-[13rem] md:max-w-[14rem]">${message}</p>
          <p class="text-[0.7rem] text-slate-500"><span class="text-slate-400">${sha}</span>${formattedDate ? ' - ' + formattedDate : ''}</p>
        </div>
        <a href="${url}" target="_blank" rel="noreferrer" class="mt-0.5 text-[0.7rem] text-rose-300 hover:text-rose-200">View</a>
      `;

      list.appendChild(li);
    });
  } catch (error) {
    console.error('Fehler beim Laden der Commits:', error);
    list.innerHTML = '<li class="text-[0.75rem] text-slate-500">Konnte Commits nicht laden.</li>';
  }
}

loadSession();
loadCommits();
applyLogos();
setStatusBadge('online');

async function loadStatus() {
  try {
    const res = await fetch('/api/status', { credentials: 'include' });
    if (!res.ok) throw new Error('status failed');
    const data = await res.json();
    const isOnline = Boolean(data?.online ?? true);
    setStatusBadge(isOnline ? 'online' : 'offline');
  } catch {
    setStatusBadge('offline');
  }
}

loadStatus();
setInterval(loadStatus, 30_000);

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-expanded');
  });
}

if (guildModalClose && guildModal) {
  guildModalClose.addEventListener('click', () => {
    guildModal.classList.add('hidden');
    guildModal.classList.remove('flex');
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      state.authenticated = false;
      state.user = null;
      state.guilds = [];
      render();
    }
  });
}

if (logoutButtonSecondary) {
  logoutButtonSecondary.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      state.authenticated = false;
      state.user = null;
      state.guilds = [];
      render();
    }
  });
}
