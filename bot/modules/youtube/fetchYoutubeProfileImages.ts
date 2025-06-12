// modules/youtube/fetchYoutubeProfileImages.ts

import { youtubeChannelImageCache } from './channelImageCache.js';
import serverSettings from '../../../config/serverSettings.json' with { type: 'json' };
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const apiKey = process.env.YOUTUBE_API_KEY;

export async function preloadYoutubeChannelImages() {
  if (!apiKey) {
    console.warn('[YouTube] ❌ Kein API-Key gesetzt. Profilbilder können nicht geladen werden.');
    return;
  }

  const allChannelIds = new Set<string>();

  for (const guild of Object.values(serverSettings.guilds)) {
    const tracked = guild.trackedYoutubeChannels ?? [];
    for (const channel of tracked) {
      allChannelIds.add(channel.channelId);
    }
  }

  const ids = Array.from(allChannelIds);
  const chunks = chunkArray(ids, 50); // API erlaubt max 50 IDs pro Anfrage

  for (const chunk of chunks) {
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet',
          id: chunk.join(','),
          key: apiKey
        }
      });

      for (const item of res.data.items) {
        const id = item.id;
        const image = item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url;
        if (image) {
          youtubeChannelImageCache.set(id, image);
          console.log(`[YouTube] 🖼️ Profilbild gecached für ${item.snippet?.title}`);
        }
      }
    } catch (err) {
      console.warn('[YouTube] ❌ Fehler beim Laden von Profilbildern:', err);
    }
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}
