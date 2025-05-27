// modules/live/getLiveStreams.ts

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
  thumbnail: string;
};

export async function getLiveStreams(usernames: string[]): Promise<LiveStream[]> {
  if (!usernames.length) return [];

  const token = await getAccessToken();
  const loginParams = usernames.map(name => `user_login=${name}`).join('&');

  const res = await fetch(`https://api.twitch.tv/helix/streams?${loginParams}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error('[TwitchStreams] Fehlerhafte Antwort:', await res.text());
    throw new Error('Twitch Streams konnten nicht geladen werden');
  }

  const data = await res.json();

  console.log('[DEBUG] Twitch Live-Streams erkannt:', data.data); // 🐞 DEBUG

  return data.data.map((entry: any) => ({
    username: entry.user_name,
    title: entry.title,
    game: entry.game_name,
    viewers: entry.viewer_count,
    thumbnail: entry.thumbnail_url
      .replace('{width}', '640')
      .replace('{height}', '360')
  }));
}

export async function getSafeTwitchThumbnail(username: string): Promise<string> {
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
