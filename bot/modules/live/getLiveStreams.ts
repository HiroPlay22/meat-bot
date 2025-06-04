import 'dotenv/config';
import fetch from 'node-fetch';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });

  if (!res.ok) {
    console.error('[TwitchToken] Fehlerhafte Antwort:', await res.text());
    throw new Error('Twitch Token konnte nicht geholt werden');
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedAccessToken;
}

export type LiveStream = {
  username: string;
  title: string;
  game: string;
  viewers: number;
  thumbnail: string;        // Vorschau-Bild (mit Fallbacks)
  categoryImage: string;    // BoxArt (Kategorie)
  profileImage: string;     // Twitch-Avatar
};

export async function getLiveStreams(usernames: string[]): Promise<LiveStream[]> {
  if (!usernames.length) return [];

  const token = await getAccessToken();
  const loginParams = usernames.map(name => `user_login=${name}`).join('&');

  // 1. Streams abrufen
  const streamRes = await fetch(`https://api.twitch.tv/helix/streams?${loginParams}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  if (!streamRes.ok) {
    console.error('[TwitchStreams] Fehlerhafte Antwort:', await streamRes.text());
    throw new Error('Twitch Streams konnten nicht geladen werden');
  }

  const streamData = await streamRes.json();
  const streams = streamData.data;

  console.log('[DEBUG] Twitch Live-Streams erkannt:', streams);

  if (!streams.length) return [];

  // 2. Nutzerinfos abrufen (Avatare)
  const userIds = streams.map((s: any) => `id=${s.user_id}`).join('&');
  const userRes = await fetch(`https://api.twitch.tv/helix/users?${userIds}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  const userData = await userRes.json();
  const userMap = Object.fromEntries(userData.data.map((u: any) => [u.id, u.profile_image_url]));

  // 3. Kategorieinfos abrufen (BoxArt)
  const gameIds = [...new Set(streams.map((s: any) => s.game_id))];
  const gameParams = gameIds.map(id => `id=${id}`).join('&');
  const gameRes = await fetch(`https://api.twitch.tv/helix/games?${gameParams}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  const gameData = await gameRes.json();
  const gameMap = Object.fromEntries(gameData.data.map((g: any) => [
    g.name,
    g.box_art_url.replace('{width}', '216').replace('{height}', '288')
  ]));

  // 4. Streams zurückgeben
  return streams.map((entry: any) => ({
    username: entry.user_name,
    title: entry.title,
    game: entry.game_name,
    viewers: entry.viewer_count,
    thumbnail: getSafeTwitchThumbnail(entry.user_login),
    profileImage: userMap[entry.user_id],
    categoryImage: gameMap[entry.game_name] ?? ''
  }));
}

export function getSafeTwitchThumbnail(username: string): string {
  const login = username.toLowerCase();
  const raw = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-640x360.jpg`;

  const fallbackImages = [
    'https://media.discordapp.net/attachments/1374459199181951087/1375184199019139213/ChatGPT_Image_22._Mai_2025_20_46_08.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189525269184532/ChatGPT_Image_22._Mai_2025_20_58_14.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189631343001791/ChatGPT_Image_22._Mai_2025_21_07_04.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189672292122726/ChatGPT_Image_22._Mai_2025_21_09_22.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375191647406526464/ChatGPT_Image_22._Mai_2025_21_20_11.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375193799244120175/ChatGPT_Image_22._Mai_2025_20_52_27.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375194092366991400/ChatGPT_Image_22._Mai_2025_21_30_11.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375198563683799100/ChatGPT_Image_22._Mai_2025_21_47_58.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375200696021811220/ChatGPT_Image_22._Mai_2025_21_56_17.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375204655289864263/ChatGPT_Image_22._Mai_2025_22_11_38.png',
    'https://media.discordapp.net/attachments/1374459199181951087/1375206874042859611/ChatGPT_Image_22._Mai_2025_22_21_01.png'
  ];

  const fallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

  return raw.includes('404_preview') ? fallback : raw;
}
