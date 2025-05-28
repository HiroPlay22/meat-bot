// test/twitchTest.ts

import { getLiveStreams } from '../bot/modules/live/getLiveStreams.js';

(async () => {
  try {
    const usernames: string[] = []; // leer = keine Streams werden gepollt

    const streams = await getLiveStreams(usernames);

    if (streams.length === 0) {
      console.log('❌ Niemand ist aktuell live.');
    } else {
      for (const stream of streams) {
        console.log(`✅ ${stream.username} ist live`);
        console.log(`🎮 Titel: ${stream.title}`);
        console.log(`📺 Kategorie: ${stream.game}`);
        console.log(`👥 Zuschauer: ${stream.viewers}`);
        console.log(`🖼️ Thumbnail: ${stream.thumbnail}`);
        console.log('---');
      }
    }
  } catch (err) {
    console.error('❌ Fehler beim Twitch-Check:', err);
  }
})();
