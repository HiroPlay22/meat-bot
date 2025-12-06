// FILE: src/web/scripts/dashboard.js
import { fetchGuildOverview } from './api.js';
import { state, subscribe, setOverview, setUser, cacheOverview, loadCachedOverview } from './state.js';
import { bootstrapLayout } from './layout.js';
import { cacheDisplayName } from './state.js';
import { renderProfile } from './profile.js';

const dashboardContent = document.getElementById('dashboard-content');
const currentGuildName = document.getElementById('current-guild-name');
const currentGuildAvatar = document.getElementById('current-guild-avatar');
const headerGuildTitle = document.getElementById('header-guild-title');
const heroGuildTitle = document.getElementById('hero-guild-title');
const heroUserName = document.getElementById('hero-user-name');
const profileCardTitle = document.getElementById('card-profile-title');
const userRoleBadge = document.getElementById('user-role-badge');
const userRoleTags = document.getElementById('user-role-tags');
const roleContent = document.getElementById('role-content');
const navProfileLabel = document.getElementById('nav-profile-label');
const calendarMonthLabel = document.getElementById('calendar-month');
const calendarGrid = document.getElementById('calendar-grid');
const calendarPrevBtn = document.getElementById('calendar-prev');
const calendarNextBtn = document.getElementById('calendar-next');
const calendarNowBtn = document.getElementById('calendar-now');

let calendarCurrentDate = new Date();
let calendarHighlights = [];

function showDashboardSkeleton() {
  // Skeleton entfernt: nichts mehr zu togglen
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

function setProfileAccent(color) {
  const root = document.documentElement;
  const resolved = color && color !== '#000000' ? color : '';
  const accent = resolved || '#22d3ee';
  root.style.setProperty('--meat-user-accent', accent);
  if (profileCardTitle) profileCardTitle.style.color = accent;
  if (userRoleBadge) userRoleBadge.style.borderColor = accent;
}

function applyUserDisplayName(displayName) {
  const label = displayName || 'User';
  if (heroUserName) heroUserName.textContent = label;
  if (profileCardTitle) profileCardTitle.textContent = label;
  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = label;
  if (navProfileLabel) {
    const possessive = /[sS]$/.test(label) ? `${label}' Profil` : `${label}'s Profil`;
    navProfileLabel.textContent = possessive;
  }
}

function renderOverviewData(data) {
  if (!data) return;
  const displayName = data?.member?.displayName || state.user?.displayName || state.user?.username || 'User';
  applyUserDisplayName(displayName);
  if (state.user) {
    const updatedUser = { ...state.user, displayName };
    setUser(updatedUser);
    renderProfile(updatedUser);
    cacheDisplayName(state.user.id, state.selectedGuildId, displayName);
  }
  const memberRoleIds = Array.isArray(data?.member?.roles) ? data.member.roles : [];
  const rolesSorted = Array.isArray(data?.roles)
    ? data.roles.filter((r) => memberRoleIds.includes(r.id)).sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    : [];
  const tagRoles = rolesSorted;
  updateUserRoleBadge(null); // Badge ausblenden
  updateUserRoleTags(tagRoles);
  const birthdayHighlights = Array.isArray(data?.birthdays)
    ? data.birthdays
        .filter((entry) => entry?.birthday)
        .map((entry) => ({
          date: entry.birthday,
          type: 'Geburtstag',
          label: entry.displayName ? `${entry.displayName} (Geburtstag)` : 'Geburtstag',
          color: '#f472b6',
        }))
    : [];
  const eventHighlights = Array.isArray(data?.events)
    ? data.events
        .filter((ev) => ev?.startTime)
        .map((ev) => ({ date: ev.startTime, type: ev.name || 'Event', label: ev.name || 'Event', color: '#22d3ee' }))
    : [];
  const holidayHighlights = Array.isArray(data?.holidays)
    ? data.holidays.map((h) => ({ date: h.date, type: h.name || 'Feiertag', label: h.name || 'Feiertag', color: '#94a3b8' }))
    : [];
  calendarHighlights = [...birthdayHighlights, ...eventHighlights, ...holidayHighlights];
  calendarCurrentDate = new Date();
  renderCalendar(calendarCurrentDate, calendarHighlights);
}

function updateUserRoleBadge(role) {
  // Badge wird nicht mehr genutzt, nur ausblenden.
  if (userRoleBadge) {
    userRoleBadge.classList.add('hidden');
    userRoleBadge.innerHTML = '';
  }
}

function updateUserRoleTags(roles = []) {
  if (!userRoleTags) return;
  userRoleTags.innerHTML = '';
  if (!roles.length) return;

  const top = roles.slice(0, 4);
  top.forEach((role) => {
    const color = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#22d3ee';
    const tag = document.createElement('span');
    tag.className = 'inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-100 border border-slate-800';
    tag.innerHTML = `<span class="inline-flex h-1.5 w-1.5 rounded-full" style="background:${color ?? '#94a3b8'}"></span>${role.name}`;
    userRoleTags.appendChild(tag);
  });

  if (roles.length > 4) {
    const more = document.createElement('span');
    more.className = 'inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-800';
    more.textContent = `+${roles.length - 4}`;
    userRoleTags.appendChild(more);
  }
}

function toggleRoleSkeleton() {}

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
  showDashboardSkeleton(true);
  toggleRoleSkeleton(true);
  try {
    const cachedOverview = loadCachedOverview(state.user?.id, state.selectedGuildId);
    const data = state.overview || cachedOverview || (await fetchGuildOverview(state.selectedGuildId));
    if (!state.overview) setOverview(data);
    cacheOverview(state.user?.id, state.selectedGuildId, data);
    renderOverviewData(data);
    toggleRoleSkeleton(false);
    showDashboardSkeleton(false);
  } catch (error) {
    console.error("loadGuildMemberData failed", error);
    const fallback = state.overview || loadCachedOverview(state.user?.id, state.selectedGuildId);
    if (fallback) {
      renderOverviewData(fallback);
    }
    toggleRoleSkeleton(false);
    showDashboardSkeleton(false);
  }
}
function renderCalendar(date = new Date(), highlights = []) {
  if (!calendarGrid) return;
  const current = new Date(date);
  current.setDate(1);
  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = current.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
  if (calendarMonthLabel) {
    const label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    calendarMonthLabel.textContent = label;
  }

  calendarGrid.innerHTML = '';
  // Monday-start offset: getDay 0=Sun -> 6, else day-1
  const firstDay = current.getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i += 1) {
    const span = document.createElement('span');
    span.className = 'py-2 text-slate-700';
    span.textContent = '';
    calendarGrid.appendChild(span);
  }

  const today = new Date();
  const isSameMonth = today.getFullYear() === year && today.getMonth() === month;

  const normalizedHighlights = Array.isArray(highlights)
    ? highlights
        .map((h) => {
          const dt = h?.date ? new Date(h.date) : null;
          if (!dt || Number.isNaN(dt.getTime())) return null;
          return {
            day: dt.getDate(),
            month: dt.getMonth(),
            year: dt.getFullYear(),
            color: h?.color || '#22d3ee',
            type: h?.type || 'event',
            label: h?.label || h?.type || 'event',
          };
        })
        .filter(Boolean)
    : [];

  for (let d = 1; d <= daysInMonth; d += 1) {
    const dayHighlights = normalizedHighlights.filter((h) => h.day === d && h.month === month && h.year === year);
    const hasHighlight = dayHighlights.length > 0;
    const primary = hasHighlight ? dayHighlights[0] : null;
    const bgClass = hasHighlight ? '' : 'bg-slate-800/60 hover:bg-slate-800/80';
    const span = document.createElement('span');
    span.textContent = String(d);
    span.className = `relative flex items-center justify-center py-2 rounded-xl transition text-slate-100 cursor-default ${bgClass}`;
    if (isSameMonth && today.getDate() === d) {
      span.classList.add('ring', 'ring-meat.primary/40');
    }
    if (primary) {
      span.classList.add('group');
      span.style.background = primary.color;
      span.style.color = '#0f172a';
      span.style.border = '1px solid rgba(15,23,42,0.2)';
      const tooltip = document.createElement('div');
      tooltip.setAttribute('role', 'tooltip');
      tooltip.className =
        'pointer-events-none absolute z-20 -top-2 left-1/2 max-w-[260px] -translate-x-1/2 -translate-y-full rounded-base bg-slate-950/95 text-slate-100 text-xs px-3 py-2 shadow-xl shadow-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border border-slate-800/80 text-left';
      dayHighlights.forEach((h) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 py-0.5 whitespace-nowrap';
        const dot = document.createElement('span');
        dot.className = 'inline-flex h-2 w-2 rounded-full';
        dot.style.background = h.color;
        const label = document.createElement('span');
        label.textContent = h.label || h.type;
        label.style.color = h.color || '#22d3ee';
        row.append(dot, label);
        tooltip.appendChild(row);
      });
      span.appendChild(tooltip);
    }
    calendarGrid.appendChild(span);
  }
}

setupDropdownExclusivity();
renderCalendar(calendarCurrentDate, calendarHighlights);
if (calendarPrevBtn) {
  calendarPrevBtn.addEventListener('click', () => {
    const next = new Date(calendarCurrentDate);
    next.setMonth(next.getMonth() - 1);
    calendarCurrentDate = next;
    renderCalendar(calendarCurrentDate, calendarHighlights);
  });
}
if (calendarNextBtn) {
  calendarNextBtn.addEventListener('click', () => {
    const next = new Date(calendarCurrentDate);
    next.setMonth(next.getMonth() + 1);
    calendarCurrentDate = next;
    renderCalendar(calendarCurrentDate, calendarHighlights);
  });
}
if (calendarNowBtn) {
  calendarNowBtn.addEventListener('click', () => {
    calendarCurrentDate = new Date();
    renderCalendar(calendarCurrentDate, calendarHighlights);
  });
}
subscribe('guildChanged', () => {
  updateGuildHeader();
  loadGuildMemberData();
});

subscribe('overviewUpdated', () => {
  // Neu geladene Overview direkt rendern, ohne zweiten Fetch
  loadGuildMemberData();
});

bootstrapLayout({
  onGuildChanged: async () => {
    await loadGuildMemberData();
  },
});

