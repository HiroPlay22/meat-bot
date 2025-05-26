// test/twitchTest.ts

import { getLiveStreams } from '../bot/modules/live/getLiveStreams.js';


(async () => {
  try {
    const usernames = ['hiro_live', 'brinibrinsen']; // hier deine Twitch-User eintragen
    const streams = await getLiveStreams(usernames);

    if (streams.length === 0) {
      console.log('❌ Niemand ist aktuell live.');
    } else {
      for (const stream of streams) {
        console.log(`✅ ${stream.username} ist live mit "${stream.title}" (${stream.viewers} Zuschauer) – Spiel: ${stream.game}`);
        console.log(`Thumbnail: ${stream.thumbnail}`);
        console.log('---');
      }
    }
  } catch (err) {
    console.error('❌ Fehler beim Twitch-Check:', err);
  }
})();
