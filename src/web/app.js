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
const guildHint = document.getElementById('guild-hint');
const guildList = document.getElementById('guild-list');
const dashboardCards = document.getElementById('dashboard-cards');
const lockedDashboardHint = document.getElementById('locked-dashboard-hint');
const authOnlyElements = document.querySelectorAll('[data-requires-auth]');

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

async function loadSession() {
  try {
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (!meRes.ok) throw new Error('no session');
    state.user = await meRes.json();
    state.authenticated = true;

    const guildRes = await fetch('/api/guilds', { credentials: 'include' });
    if (guildRes.ok) state.guilds = await guildRes.json();
  } catch {
    state.authenticated = false;
    state.user = null;
    state.guilds = [];
  }

  render();
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
