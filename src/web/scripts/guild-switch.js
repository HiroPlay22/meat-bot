// FILE: src/web/scripts/guild-switch.js
import { setSelectedGuild, state } from './state.js';

const guildSwitchButton = document.getElementById('guild-switch-button');
const guildSwitchMenu = document.getElementById('guild-switch-menu');
const currentGuildName = document.getElementById('current-guild-name');
const currentGuildAvatar = document.getElementById('current-guild-avatar');

function renderHeader() {
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

function renderMenu() {
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
      renderHeader();
      renderMenu();
      if (guildSwitchMenu) guildSwitchMenu.classList.add('hidden');
    });
    guildSwitchMenu.appendChild(btn);
  });
}

function toggleMenu() {
  if (!guildSwitchMenu) return;
  guildSwitchMenu.classList.toggle('hidden');
}

export function initGuildSwitch() {
  renderHeader();
  renderMenu();

  if (guildSwitchButton) {
    guildSwitchButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  document.addEventListener('click', (event) => {
    if (guildSwitchMenu && !guildSwitchMenu.contains(event.target) && !guildSwitchButton?.contains(event.target)) {
      guildSwitchMenu.classList.add('hidden');
    }
  });
}

export function openGuildSelectModal(onSelect) {
  if (!state.guilds.length) return;
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4';

  const modal = document.createElement('div');
  modal.className =
    'w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-slate-900/70';

  const title = document.createElement('div');
  title.className = 'flex items-center justify-between pb-3 border-b border-slate-800/80';
  title.innerHTML =
    '<div><p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Server wählen</p><p class="text-sm text-slate-200">Wähle den Server für dein Dashboard.</p></div>';

  const list = document.createElement('div');
  list.className = 'mt-3 space-y-2 max-h-80 overflow-y-auto pr-1';

  state.guilds.forEach((guild) => {
    const unavailable = guild.botPresent === false;
    const card = document.createElement('button');
    card.type = 'button';
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
              ? '<p class="mt-1 text-[0.7rem] text-amber-400">Bot nicht installiert – jetzt einladen?</p>'
              : ''
          }
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      if (unavailable) {
        if (guild.inviteUrl) window.open(guild.inviteUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      setSelectedGuild(guild.id);
      renderHeader();
      renderMenu();
      if (onSelect) onSelect(guild.id);
      backdrop.remove();
    });
    list.appendChild(card);
  });

  modal.appendChild(title);
  modal.appendChild(list);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}
