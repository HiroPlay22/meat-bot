import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Erstellt einen Clip für den angegebenen Broadcaster.
 * @returns Die URL des neuen Clips oder null bei Fehler
 */
export async function createTwitchClip(): Promise<string | null> {
  const accessToken = process.env.TWITCH_BOT_ACCESS_TOKEN!;
  const clientId = process.env.TWITCH_BOT_CLIENT_ID!;
  const broadcasterLogin = process.env.TWITCH_BOT_CHANNEL!;

  // 1. Broadcaster-ID abrufen
  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${broadcasterLogin}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': clientId
    }
  });

  const userData = await userRes.json();
  const broadcasterId = userData.data?.[0]?.id;

  if (!broadcasterId) {
    console.error('❌ Broadcaster-ID konnte nicht ermittelt werden');
    return null;
  }

  // 2. Clip erstellen
  const clipRes = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': clientId
    }
  });

  const clipData = await clipRes.json();
  const clipId = clipData.data?.[0]?.id;

  if (!clipId) {
    console.error('❌ Clip konnte nicht erstellt werden:', clipData);
    return null;
  }

  const clipUrl = `https://clips.twitch.tv/${clipId}`;
  return clipUrl;
}
