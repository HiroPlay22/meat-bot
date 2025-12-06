// FILE: src/web/scripts/events.js
import { fetchGuildOverview } from './api.js';
import { bootstrapLayout } from './layout.js';
import { setOverview, state } from './state.js';

async function loadOverview() {
  if (!state.selectedGuildId) return;
  try {
    const data = await fetchGuildOverview(state.selectedGuildId);
    setOverview(data);
  } catch (err) {
    console.error('Events: fetchGuildOverview failed', err);
  }
}

bootstrapLayout({
  onGuildChanged: async () => {
    await loadOverview();
  },
});
