import fetch from 'node-fetch';
import 'dotenv/config';


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

  if (!res.ok) throw new Error('Twitch Token konnte nicht geholt werden');

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedAccessToken;
}

type LiveStream = {
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

  if (!res.ok) throw new Error('Twitch Streams konnten nicht geladen werden');

  const data = await res.json();
  return data.data.map((entry: any) => ({
    username: entry.user_name,
    title: entry.title,
    game: entry.game_name,
    viewers: entry.viewer_count,
    thumbnail: entry.thumbnail_url.replace('{width}', '640').replace('{height}', '360')
  }));
}
