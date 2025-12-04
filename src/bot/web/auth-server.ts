// FILE: src/bot/web/auth-server.ts

import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { logError, logInfo, logWarn } from '../general/logging/logger.js';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type OAuthState = {
  codeVerifier: string;
  createdAt: number;
};

type SessionData = {
  user: {
    id: string;
    username: string;
    discriminator?: string;
    avatar?: string | null;
  };
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

const stateStore = new Map<string, OAuthState>();
const sessionStore = new Map<string, SessionData>();
const rateLimits = new Map<string, RateLimitEntry>();

const env = {
  clientId: process.env.DISCORD_CLIENT_ID ?? '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
  redirectUri: process.env.DISCORD_REDIRECT_URI ?? '',
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  botGuildIds: process.env.BOT_GUILD_IDS ?? process.env.DEV_GUILD_IDS ?? '',
};

function isEnvReady() {
  return (
    env.clientId.trim() !== '' &&
    env.clientSecret.trim() !== '' &&
    env.redirectUri.trim() !== '' &&
    env.allowedOrigin.trim() !== ''
  );
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomString(byteLength = 48) {
  return base64UrlEncode(crypto.randomBytes(byteLength));
}

let redisClient: Awaited<ReturnType<typeof import('redis')['createClient']>> | null = null;

async function getRedisClient() {
  if (!env.redisUrl.trim()) return null;
  if (redisClient) return redisClient;
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: env.redisUrl });
    redisClient.on('error', (error) => logWarn('Redis-Client Fehler', { functionName: 'authServer', extra: { error } }));
    await redisClient.connect();
    logInfo('Redis-Client verbunden (Auth-Server)', { functionName: 'authServer' });
    return redisClient;
  } catch (error) {
    logWarn('Redis konnte nicht verbunden werden, fallback auf In-Memory', { functionName: 'authServer', extra: { error } });
    redisClient = null;
    return null;
  }
}

function parseCookies(req: IncomingMessage) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function applySecurityHeaders(res: ServerResponse) {
  const headers: Record<string, string> = {
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  };
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }
  if (env.allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = env.allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
}

function setCookie(
  res: ServerResponse,
  name: string,
  value: string,
  options: { maxAge?: number; httpOnly?: boolean; sameSite?: 'Lax' | 'None' } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/'];

  if (options.httpOnly !== false) parts.push('HttpOnly');

  if (process.env.NODE_ENV === 'production') {
    // Set Domain, Secure und SameSite, damit der Cookie über Cloudflare/Worker und die Hauptdomain gültig bleibt.
    try {
      const originHost = new URL(env.allowedOrigin).hostname;
      if (originHost) parts.push(`Domain=.${originHost}`);
    } catch {
      // Fallback: kein Domain-Attribut
    }
    parts.push('Secure');
    parts.push(`SameSite=${options.sameSite ?? 'Lax'}`);
  } else if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  const existing = res.getHeader('Set-Cookie');
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, parts.join('; ')]);
  } else if (typeof existing === 'string') {
    res.setHeader('Set-Cookie', [existing, parts.join('; ')]);
  } else {
    res.setHeader('Set-Cookie', parts.join('; '));
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  applySecurityHeaders(res);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...(env.allowedOrigin
      ? { 'Access-Control-Allow-Origin': env.allowedOrigin, 'Access-Control-Allow-Credentials': 'true' }
      : {}),
  });
  res.end(JSON.stringify(body));
}

async function isRateLimited(req: IncomingMessage) {
  const ip = req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 40;

  const redis = await getRedisClient();
  if (redis) {
    try {
      const key = `meat:auth:rl:${ip}`;
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, Math.floor(windowMs / 1000));
      }
      if (current > limit) {
        logWarn('Rate-Limit auf /api/auth/login erreicht', { functionName: 'rateLimit', extra: { ip, current } });
        return true;
      }
      return false;
    } catch (error) {
      logWarn('Rate-Limit Redis-Fehler, fallback auf Memory', { functionName: 'rateLimit', extra: { error } });
    }
  }

  const current = rateLimits.get(ip);
  if (!current || current.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= limit) {
    logWarn('Rate-Limit auf /api/auth/login erreicht', { functionName: 'rateLimit', extra: { ip } });
    return true;
  }

  current.count += 1;
  rateLimits.set(ip, current);
  return false;
}

async function saveState(state: string, data: OAuthState) {
  const redis = await getRedisClient();
  if (redis) {
    await redis.setEx(`meat:auth:state:${state}`, 600, JSON.stringify(data));
    return;
  }
  stateStore.set(state, data);
}

async function consumeState(state: string) {
  const redis = await getRedisClient();
  if (redis) {
    const key = `meat:auth:state:${state}`;
    const raw = await redis.get(key);
    if (!raw) return undefined;
    await redis.del(key);
    return JSON.parse(raw) as OAuthState;
  }
  const data = stateStore.get(state);
  stateStore.delete(state);
  return data;
}

async function saveSession(sessionId: string, data: SessionData) {
  const redis = await getRedisClient();
  const ttlSeconds = 60 * 60 * 24 * 7;
  if (redis) {
    await redis.setEx(`meat:auth:session:${sessionId}`, ttlSeconds, JSON.stringify(data));
    return;
  }
  sessionStore.set(sessionId, data);
}

async function loadSession(sessionId: string) {
  const redis = await getRedisClient();
  if (redis) {
    const raw = await redis.get(`meat:auth:session:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  }
  return sessionStore.get(sessionId) ?? null;
}

async function deleteSession(sessionId: string) {
  const redis = await getRedisClient();
  if (redis) {
    await redis.del(`meat:auth:session:${sessionId}`);
  }
  sessionStore.delete(sessionId);
}

async function handleLogin(res: ServerResponse) {
  const state = generateRandomString(24);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

  await saveState(state, { codeVerifier, createdAt: Date.now() });

  const params = new URLSearchParams({
    client_id: env.clientId,
    response_type: 'code',
    redirect_uri: env.redirectUri,
    scope: 'identify guilds',
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  setCookie(res, 'meat_oauth_state', state, { maxAge: 600 });
  applySecurityHeaders(res);
  res.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${params.toString()}` });
  res.end();
}

async function exchangeCode(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new Error(`Token-Exchange fehlgeschlagen: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  };

  return data;
}

async function fetchUser(accessToken: string) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('User-Request fehlgeschlagen');
  return res.json() as Promise<{
    id: string;
    username: string;
    discriminator?: string;
    avatar?: string | null;
  }>;
}

async function fetchGuilds(accessToken: string) {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Guild-Request fehlgeschlagen');
  return res.json() as Promise<
    Array<{
      id: string;
      name: string;
      owner: boolean;
      permissions: number;
      icon: string | null;
      botPresent?: boolean;
    }>
  >;
}

function filterGuilds(guilds: Awaited<ReturnType<typeof fetchGuilds>>) {
  const allowList = env.botGuildIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Wenn keine Liste gepflegt ist, zeigen wir alle Guilds des Users (kann aber mehr sein als Bot-Guilds).
  if (allowList.length === 0) return guilds;

  // Nur Guilds, auf denen der Bot laut Liste drauf ist UND der User Mitglied ist (User-Guilds sind bereits gefiltert).
  return guilds
    .filter((g) => allowList.includes(g.id))
    .map((g) => ({ ...g, botPresent: true }));
}

async function handleCallback(req: IncomingMessage, res: ServerResponse, query: URLSearchParams) {
  const code = query.get('code');
  const state = query.get('state');
  const cookies = parseCookies(req);
  const storedState = state ? await consumeState(state) : undefined;

  if (!code || !state || !storedState || cookies.meat_oauth_state !== state) {
    logWarn('Ungültiger Callback (State/Code fehlt oder passt nicht)', { functionName: 'authCallback' });
    applySecurityHeaders(res);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  try {
    const tokenData = await exchangeCode(code, storedState.codeVerifier);
    const user = await fetchUser(tokenData.access_token);

    const sessionId = generateRandomString(48);
    await saveSession(sessionId, {
      user,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
    });

    setCookie(res, 'meat_session', sessionId, { maxAge: 60 * 60 * 24 * 7 });
    applySecurityHeaders(res);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (error) {
    logError('Callback fehlgeschlagen', { functionName: 'authCallback', extra: { error } });
    applySecurityHeaders(res);
    res.writeHead(302, { Location: '/' });
    res.end();
  }
}

function getSession(req: IncomingMessage) {
  const cookies = parseCookies(req);
  const sessionId = cookies.meat_session;
  if (!sessionId) return null;
  return sessionId;
}

function handleLogout(res: ServerResponse, sessionId?: string) {
  if (sessionId) void deleteSession(sessionId);
  setCookie(res, 'meat_session', '', { maxAge: 0 });
  applySecurityHeaders(res);
  res.writeHead(204);
  res.end();
}

async function handleMe(req: IncomingMessage, res: ServerResponse) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });
  const { user } = session;
  return json(res, 200, {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
  });
}

async function handleGuilds(req: IncomingMessage, res: ServerResponse) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });

  try {
    const guilds = await fetchGuilds(session.accessToken);
    const filtered = filterGuilds(guilds);
    return json(
      res,
      200,
      filtered.map((g) => ({
        id: g.id,
        name: g.name,
        owner: g.owner,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      })),
    );
  } catch (error) {
    logError('Fehler beim Laden der Guilds', { functionName: 'apiGuilds', extra: { error } });
    return json(res, 500, { error: 'guilds_failed' });
  }
}

function handleOptions(res: ServerResponse) {
  applySecurityHeaders(res);
  res.writeHead(204, {
    'Access-Control-Allow-Origin': env.allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  });
  res.end();
}

export function startAuthServer() {
  if (!isEnvReady()) {
    logWarn('Auth-Server wird nicht gestartet (ENV unvollständig)', {
      functionName: 'authServer',
      extra: { envReady: isEnvReady() },
    });
    return;
  }

  const port = Number(process.env.PORT ?? 3000);

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;

    if (req.method === 'OPTIONS') {
      handleOptions(res);
      return;
    }

    if (path === '/api/auth/login' && req.method === 'GET') {
      if (await isRateLimited(req)) {
        applySecurityHeaders(res);
        res.writeHead(429);
        res.end();
        return;
      }
      await handleLogin(res);
      return;
    }

    if (path === '/api/auth/callback/discord' && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleCallback(req, res, url.searchParams);
      return;
    }

    if (path === '/api/auth/logout' && req.method === 'POST') {
      applySecurityHeaders(res);
      const sessionId = getSession(req);
      handleLogout(res, sessionId ?? undefined);
      return;
    }

    if (path === '/api/me' && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleMe(req, res);
      return;
    }

    if (path === '/api/guilds' && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleGuilds(req, res);
      return;
    }

    applySecurityHeaders(res);
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    logInfo(`Auth-Server läuft auf Port ${port}`, { functionName: 'authServer' });
  });
}
