// Minimaler Auth- und UI-Loader fÃ¼r die statische Preview

const state = {
  authenticated: false,
  user: null,
  guilds: [],
  selectedGuildId: null,
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
const sidebarReal = document.getElementById('sidebar-real');
const sidebarSkeleton = document.getElementById('sidebar-skeleton');
const isDashboardPage = window.location.pathname.includes('dashboard');
const dashboardContent = document.getElementById('dashboard-content');
const dashboardSkeleton = document.getElementById('dashboard-skeleton');
const guildModal = document.getElementById('guild-modal');
const guildModalList = document.getElementById('guild-modal-list');
const currentGuildName = document.getElementById('current-guild-name');
const currentGuildAvatar = document.getElementById('current-guild-avatar');
const guildSwitchButton = document.getElementById('guild-switch-button');
const guildSwitchMenu = document.getElementById('guild-switch-menu');
const profileButton = document.getElementById('profile-button');
const profileDropdown = document.getElementById('profile-dropdown');
const profileName = document.getElementById('profile-name');
const profileAvatar = document.getElementById('profile-avatar');

const logoConfig = (() => {
  const now = new Date();
  const isDecember = now.getMonth() === 11;
  return {
    candidates: isDecember
      ? [
          { type: 'image', url: 'assets/logo/meat_logo_xmas.png' },
          { type: 'image', url: 'assets/logo/meat_logo.png' },
        ]
      : [{ type: 'image', url: 'assets/logo/meat_logo.png' }],
  };
})();

async function applyLogos() {
  if (!logoTargets.length) return;

  const firstImage = logoConfig.candidates.find((c) => c.type === 'image');

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

  // Set initial fallback image immediately
  if (firstImage) {
    setImage(firstImage.url);
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

  if (profileName && profileAvatar) {
    if (state.authenticated && state.user) {
      profileName.textContent = state.user.username ?? 'User';
      const initial = state.user.username ? state.user.username.charAt(0).toUpperCase() : '?';
      profileAvatar.textContent = initial;
    }
  }

  if (logoutButton) {
    logoutButton.classList.toggle('hidden', !state.authenticated);
  }
  if (logoutButtonSecondary) {
    logoutButtonSecondary.classList.toggle('hidden', !state.authenticated);
  }

  renderGuilds();

  if (isDashboardPage) {
    updateGuildHeader();
    renderGuildSwitchMenu();
  }
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
        <span>Ã–ffnen</span>
        <span class="text-lg">â†’</span>
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
  if (state.selectedGuildId) return;
  guildModal.classList.remove('hidden');
  guildModal.classList.add('flex');
  guildModalList.innerHTML = '';
  if (!state.guilds.length) {
    guildModalList.innerHTML =
      '<div class="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">Keine Server gefunden. Stelle sicher, dass du Admin/Owner bist und der Bot freigeschaltet ist.</div>';
    return;
  }
  state.guilds.forEach((guild) => {
    const card = document.createElement('button');
    card.type = 'button';
    const unavailable = guild.botPresent === false;
    card.className = [
      'w-full text-left rounded-xl border bg-slate-900/80 p-4 transition',
      unavailable
        ? 'border-slate-800/60 text-slate-500 opacity-70 cursor-not-allowed'
        : 'border-slate-800 hover:border-rose-500 hover:text-rose-100',
    ].join(' ');
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
          ${
            unavailable
              ? '<p class="mt-1 text-[0.7rem] text-amber-400">Bot nicht installiert â€“ jetzt einladen?</p>'
              : ''
          }
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      if (unavailable) {
        if (guild.inviteUrl) {
          window.open(guild.inviteUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      guildModal.classList.add('hidden');
      guildModal.classList.remove('flex');
      setSelectedGuild(guild.id);
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

function storageKeysForUser(userId) {
  return {
    guilds: `meat_guilds_${userId}`,
    selected: `meat_selected_guild_${userId}`,
  };
}

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

function renderGuildSwitchMenu() {
  if (!guildSwitchMenu) return;
  guildSwitchMenu.innerHTML = '';
  if (!state.guilds.length) {
    guildSwitchMenu.innerHTML =
      '<div class="px-3 py-2 text-[11px] text-slate-500">Keine Server gefunden.</div>';
    return;
  }

  state.guilds.forEach((guild) => {
    const unavailable = guild.botPresent === false;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = [
      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-xl',
      unavailable
        ? 'text-slate-500 hover:bg-slate-900/60 cursor-not-allowed'
        : 'text-slate-100 hover:bg-slate-900/70',
    ].join(' ');
    const initial = guild.name ? guild.name.charAt(0).toUpperCase() : '?';
    btn.innerHTML = `
      <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-900 border border-slate-800">
        ${
          guild.icon
            ? `<img src="${guild.icon}" alt="${guild.name}" class="h-8 w-8 object-cover" />`
            : `<span class="text-sm text-slate-400">${initial}</span>`
        }
      </div>
      <div class="flex-1">
        <p class="text-xs font-semibold leading-tight">${guild.name}</p>
        <p class="text-[10px] text-slate-500">${unavailable ? 'Bot nicht installiert' : 'Bot aktiv'}</p>
      </div>
      ${
        unavailable && guild.inviteUrl
          ? '<span class="text-[10px] text-amber-400">Einladen</span>'
          : state.selectedGuildId === guild.id
            ? '<span class="text-[10px] text-emerald-400">Aktiv</span>'
            : ''
      }
    `;
    btn.addEventListener('click', () => {
      if (unavailable) {
        if (guild.inviteUrl) window.open(guild.inviteUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      setSelectedGuild(guild.id);
      guildSwitchMenu.classList.add('hidden');
    });
    guildSwitchMenu.appendChild(btn);
  });
}

function setSelectedGuild(guildId, { persist = true } = {}) {
  state.selectedGuildId = guildId;
  if (persist && state.user) {
    const keys = storageKeysForUser(state.user.id);
    sessionStorage.setItem(keys.selected, guildId);
  }
  updateGuildHeader();
  renderGuildSwitchMenu();
  showDashboardSkeleton(false);
}

function ensureSelectedGuild() {
  if (!state.user || !state.guilds.length) return;
  const keys = storageKeysForUser(state.user.id);
  const stored = sessionStorage.getItem(keys.selected);
  const hasStored = stored && state.guilds.some((g) => g.id === stored);
  if (hasStored) {
    setSelectedGuild(stored, { persist: false });
    return true;
  }
  return false;
}

async function loadSession() {
  try {
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (!meRes.ok) throw new Error('no session');
    state.user = await meRes.json();
    state.authenticated = true;

    const keys = storageKeysForUser(state.user.id);
    const cached = sessionStorage.getItem(keys.guilds);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          state.guilds = parsed;
        }
      } catch {
        // ignore
      }
    }

    if (!state.guilds.length) {
      const guildRes = await fetch('/api/guilds', { credentials: 'include' });
      if (guildRes.ok) {
        state.guilds = await guildRes.json();
        sessionStorage.setItem(keys.guilds, JSON.stringify(state.guilds));
      }
    }

    ensureSelectedGuild();

    if (!isDashboardPage) {
      const main = document.querySelector('main');
      if (main) {
        main.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 300);
      } else {
        window.location.href = '/dashboard.html';
      }
      return;
    }
  } catch {
    state.authenticated = false;
    state.user = null;
    state.guilds = [];
    state.selectedGuildId = null;
    sessionStorage.clear();

    if (isDashboardPage) {
      window.location.href = '/';
      return;
    }
  }

  render();
  if (isDashboardPage) {
    pushDashboardUrl();
    if (!state.selectedGuildId) {
      showDashboardSkeleton(true);
      showGuildModal();
    } else {
      showDashboardSkeleton(false);
    }
    const main = document.querySelector('main');
    if (main) {
      main.classList.remove('fade-out');
      main.classList.add('fade-in');
    }
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
let lastStatus = 'online';
setStatusBadge(lastStatus);

async function loadStatus() {
  try {
    const res = await fetch('/api/status', { credentials: 'include' });
    if (!res.ok) throw new Error('status failed');
    const data = await res.json();
    lastStatus = Boolean(data?.online ?? true) ? 'online' : 'offline';
    setStatusBadge(lastStatus);
  } catch {
    // bei Fehler den letzten bekannten Status beibehalten
    setStatusBadge(lastStatus);
  }
}

loadStatus();
setInterval(loadStatus, 30_000);

function toggleVisibility(element) {
  if (!element) return;
  element.classList.toggle('hidden');
}

// Dropdown handling
if (guildSwitchButton) {
  guildSwitchButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVisibility(guildSwitchMenu);
  });
}

if (profileButton) {
  profileButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVisibility(profileDropdown);
  });
}

document.addEventListener('click', (event) => {
  if (guildSwitchMenu && !guildSwitchMenu.contains(event.target) && !guildSwitchButton?.contains(event.target)) {
    guildSwitchMenu.classList.add('hidden');
  }
  if (profileDropdown && !profileDropdown.contains(event.target) && !profileButton?.contains(event.target)) {
    profileDropdown.classList.add('hidden');
  }
});

// Sprache (nur UI-Schalter, aktuell ohne Backend)
const langDe = document.getElementById('lang-de');
const langEn = document.getElementById('lang-en');
let currentLanguage = localStorage.getItem('meat_lang') || 'de';

function applyLanguageButtons() {
  if (langDe) {
    langDe.classList.toggle('opacity-50', currentLanguage !== 'de');
    langDe.classList.toggle('cursor-not-allowed', currentLanguage !== 'de');
  }
  if (langEn) {
    langEn.classList.add('opacity-50');
    langEn.classList.add('cursor-not-allowed');
  }
}

if (langDe) {
  langDe.addEventListener('click', (e) => {
    e.preventDefault();
    currentLanguage = 'de';
    localStorage.setItem('meat_lang', currentLanguage);
    applyLanguageButtons();
  });
}

if (langEn) {
  langEn.addEventListener('click', (e) => {
    e.preventDefault();
  });
}

applyLanguageButtons();

const profileLogout = document.getElementById('profile-logout');
if (profileLogout) {
  profileLogout.addEventListener('click', (e) => {
    e.preventDefault();
    if (logoutButtonSecondary) {
      logoutButtonSecondary.click();
    } else if (logoutButton) {
      logoutButton.click();
    }
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
      state.selectedGuildId = null;
      sessionStorage.clear();
      window.location.href = '/';
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
      state.selectedGuildId = null;
      sessionStorage.clear();
      window.location.href = '/';
    }
  });
}
