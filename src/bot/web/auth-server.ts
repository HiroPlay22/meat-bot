// FILE: src/bot/web/auth-server.ts

import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { logError, logInfo, logWarn } from '../general/logging/logger.js';
import { prisma } from '../general/db/prismaClient.js';

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
const serverStartedAt = Date.now();
const guildsCache = new Map<string, { data: any; cachedAt: number }>();
const GUILDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minuten Cache pro User

const env = {
  clientId: process.env.DISCORD_CLIENT_ID ?? '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
  redirectUri: process.env.DISCORD_REDIRECT_URI ?? '',
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  botGuildIds: process.env.BOT_GUILD_IDS ?? process.env.DEV_GUILD_IDS ?? '',
  botToken: process.env.DISCORD_TOKEN ?? '',
  invitePermissions: process.env.BOT_INVITE_PERMISSIONS ?? '0',
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

async function parseBody(req: IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 64) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
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

async function saveCachedGuilds(userId: string, data: any) {
  const payload = JSON.stringify({ data, cachedAt: Date.now() });
  const redis = await getRedisClient();
  if (redis) {
    await redis.setEx(`meat:auth:guilds:${userId}`, Math.floor(GUILDS_CACHE_TTL_MS / 1000), payload);
  } else {
    guildsCache.set(userId, { data, cachedAt: Date.now() });
  }
}

async function loadCachedGuilds(userId: string) {
  const now = Date.now();
  const redis = await getRedisClient();
  if (redis) {
    const raw = await redis.get(`meat:auth:guilds:${userId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { data: any; cachedAt: number };
        if (parsed?.cachedAt && now - parsed.cachedAt < GUILDS_CACHE_TTL_MS) {
          return parsed.data;
        }
      } catch {
        // ignore parse errors
      }
    }
  } else {
    const cached = guildsCache.get(userId);
    if (cached && now - cached.cachedAt < GUILDS_CACHE_TTL_MS) {
      return cached.data;
    }
  }
  return null;
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
  const raw = await res.text();
  if (!res.ok) {
    const err: any = new Error(`Guild-Request fehlgeschlagen: ${res.status}`);
    err.status = res.status;
    err.body = raw?.slice(0, 500);
    throw err;
  }
  return JSON.parse(raw) as Promise<
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

async function fetchGuildRoles(guildId: string) {
  if (!env.botToken) throw new Error('Bot-Token fehlt');
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${env.botToken}` },
  });
  if (!res.ok) throw new Error(`Roles-Request fehlgeschlagen: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      name: string;
      color: number;
      position: number;
    }>
  >;
}

async function fetchGuildMember(guildId: string, userId: string) {
  if (!env.botToken) throw new Error('Bot-Token fehlt');
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${env.botToken}` },
  });
  if (!res.ok) throw new Error(`Member-Request fehlgeschlagen: ${res.status}`);
  return res.json() as Promise<{
    user: {
      id: string;
      username: string;
      global_name?: string | null;
      avatar?: string | null;
    };
    nick?: string | null;
    roles: string[];
    avatar?: string | null;
    communication_disabled_until?: string | null;
  }>;
}

async function fetchGuildInfo(guildId: string) {
  if (!env.botToken) throw new Error('Bot-Token fehlt');
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
    headers: { Authorization: `Bot ${env.botToken}` },
  });
  if (!res.ok) throw new Error(`Guild-Request fehlgeschlagen: ${res.status}`);
  return res.json() as Promise<{
    id: string;
    name: string;
    icon?: string | null;
    approximate_member_count?: number;
    features?: string[];
    premium_progress_bar_enabled?: boolean;
    premium_subscription_count?: number;
    preferred_locale?: string;
  verification_level?: number;
}>;
}

async function fetchGuildEvents(guildId: string) {
  if (!env.botToken) throw new Error('Bot-Token fehlt');
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/scheduled-events`, {
    headers: { Authorization: `Bot ${env.botToken}` },
  });
  if (!res.ok) throw new Error(`Events-Request fehlgeschlagen: ${res.status}`);
  return res.json() as Promise<
    Array<{
      id: string;
      name: string;
      scheduled_start_time: string;
      scheduled_end_time?: string | null;
      status?: number;
      entity_type?: number;
    }>
  >;
}


const botPresenceCache = new Map<
  string,
  {
    present: boolean;
    checkedAt: number;
  }
>();

async function checkBotPresence(guildId: string): Promise<boolean> {
  if (!env.botToken) return true; // ohne Token nicht blockieren
  const cached = botPresenceCache.get(guildId);
  const now = Date.now();
  const ttl = 10 * 60 * 1000; // 10 Minuten
  if (cached && now - cached.checkedAt < ttl) {
    return cached.present;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${env.botToken}` },
    });
    const present = res.ok;
    botPresenceCache.set(guildId, { present, checkedAt: now });
    return present;
  } catch {
    botPresenceCache.set(guildId, { present: false, checkedAt: now });
    return false;
  }
}

function filterGuilds(guilds: Awaited<ReturnType<typeof fetchGuilds>>) {
  const allowList = env.botGuildIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Wenn keine Liste gepflegt ist, lieber nichts zurückgeben, um keine falschen Guilds anzuzeigen.
  if (allowList.length === 0) return [];

  // Nur freigegebene Guilds; botPresent setzen wir später via Bot-Check
  return guilds.filter((g) => allowList.includes(g.id));
}

function isGuildAllowed(guildId: string) {
  const allowList = env.botGuildIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowList.length === 0) return false;
  return allowList.includes(guildId);
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
    res.writeHead(302, { Location: '/dashboard.html' });
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
    avatar: user.avatar ?? null,
  });
}

async function handleStatus(res: ServerResponse) {
  // Minimaler Status-Endpunkt; kann bei Bedarf um echte Bot-Daten erweitert werden.
  return json(res, 200, {
    online: true,
    startedAt: serverStartedAt,
  });
}

async function handleGuilds(req: IncomingMessage, res: ServerResponse) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });

  const cachedGuilds = await loadCachedGuilds(session.user.id);
  if (cachedGuilds) {
    return json(res, 200, cachedGuilds);
  }

  try {
    const guilds = await fetchGuilds(session.accessToken);
    const filtered = filterGuilds(guilds);

    const enriched = await Promise.all(
      filtered.map(async (g) => {
        const present = await checkBotPresence(g.id);
        const inviteUrl = present
          ? undefined
          : `https://discord.com/api/oauth2/authorize?client_id=${env.clientId}&scope=bot%20applications.commands&permissions=${env.invitePermissions}&guild_id=${g.id}&disable_guild_select=true`;
        return {
          id: g.id,
          name: g.name,
          owner: g.owner,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
          botPresent: present,
          inviteUrl,
        };
      }),
    );
    await saveCachedGuilds(session.user.id, enriched);
    return json(res, 200, enriched);
  } catch (error: any) {
    const fallback = await loadCachedGuilds(session.user.id);
    const extra = {
      error: {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        code: error?.code,
        status: error?.status,
        body: error?.body,
      },
      userId: session?.user?.id,
    };
    if (error?.status === 429 && fallback) {
      logWarn('Guilds Rate-Limit, liefere Cache', { functionName: 'apiGuilds', extra });
      return json(res, 200, fallback);
    }
    if (fallback) {
      logWarn('Guilds Fehler, liefere Cache', { functionName: 'apiGuilds', extra });
      return json(res, 200, fallback);
    }
    logError('Fehler beim Laden der Guilds', { functionName: 'apiGuilds', extra });
    return json(res, error?.status === 429 ? 429 : 500, { error: 'guilds_failed' });
  }
}

async function handleGuildMember(req: IncomingMessage, res: ServerResponse, guildId: string) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });

  if (!isGuildAllowed(guildId)) return json(res, 403, { error: 'forbidden' });

  try {
    const present = await checkBotPresence(guildId);
    if (!present) return json(res, 400, { error: 'bot_not_present' });

    const [roles, member, guildInfo] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchGuildMember(guildId, session.user.id),
      fetchGuildInfo(guildId),
    ]);

    const memberRoles = roles.filter((r) => member.roles.includes(r.id));
    const highestRole = memberRoles.sort((a, b) => b.position - a.position)[0];
    const resolvedHighest = highestRole
      ? {
          id: highestRole.id,
          name: highestRole.name,
          color: highestRole.color,
          position: highestRole.position,
        }
      : null;

    const displayName = member.nick || member.user.global_name || member.user.username;
    return json(res, 200, {
      guild: {
        id: guildId,
        name: guildInfo?.name,
        icon: guildInfo?.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png` : null,
      },
      member: {
        id: member.user.id,
        displayName,
        avatar: member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
          : null,
        roles: member.roles,
      },
      roles: roles.map((r) => ({ id: r.id, name: r.name, color: r.color, position: r.position })),
      highestRoleResolved: resolvedHighest,
    });
  } catch (error) {
    logError('Fehler beim Laden von Guild-Member', { functionName: 'apiGuildMember', extra: { error, guildId } });
    return json(res, 500, { error: 'guild_member_failed' });
  }
}

async function handleGuildOverview(req: IncomingMessage, res: ServerResponse, guildId: string) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });

  if (!isGuildAllowed(guildId)) return json(res, 403, { error: 'forbidden' });

  try {
    const present = await checkBotPresence(guildId);
    if (!present) return json(res, 400, { error: 'bot_not_present' });

    const [roles, member, guildInfo, consent, commandUsageTotal, profile, events, holidays] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchGuildMember(guildId, session.user.id),
      fetchGuildInfo(guildId),
      (prisma as any).userTrackingConsent.findUnique({
        where: { guildId_userId: { guildId, userId: session.user.id } },
      }),
      (prisma as any).commandUsage.count({ where: { guildId } }).catch(() => null),
      (prisma as any).userProfile.findUnique({
        where: { userId: session.user.id },
        select: { birthday: true },
      }),
      fetchGuildEvents(guildId).catch(() => []),
      (prisma as any).holiday
        .findMany({
          select: { id: true, name: true, date: true, region: true },
        })
        .catch(() => []),
    ]);

    const memberRoles = roles.filter((r) => member.roles.includes(r.id)).sort((a, b) => (b.position ?? 0) - (a.position ?? 0));
    const highestRole = memberRoles[0] || null;
    const displayName = member.nick || member.user.global_name || member.user.username;
    const consentStatus = consent?.status ?? 'NONE';
    const includeBirthday =
      consentStatus === 'ALLOWED' && profile?.birthday
        ? [{ userId: session.user.id, birthday: profile.birthday, displayName }]
        : [];

    return json(res, 200, {
      guild: {
        id: guildId,
        name: guildInfo?.name,
        icon: guildInfo?.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png` : null,
        memberCount: guildInfo?.approximate_member_count ?? null,
        features: guildInfo?.features ?? [],
      },
      member: {
        id: member.user.id,
        displayName,
        avatar: member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
          : null,
        roles: member.roles,
      },
      roles: roles.map((r) => ({ id: r.id, name: r.name, color: r.color, position: r.position })),
      highestRoleResolved: highestRole
        ? { id: highestRole.id, name: highestRole.name, color: highestRole.color, position: highestRole.position }
        : null,
      consentStatus,
      birthdays: includeBirthday,
      events: Array.isArray(events)
        ? events.map((e) => ({
            id: e.id,
            name: e.name,
            startTime: e.scheduled_start_time,
            endTime: e.scheduled_end_time ?? null,
            status: e.status ?? null,
          }))
        : [],
      holidays: Array.isArray(holidays)
        ? holidays
            .filter((h: any) => h?.date)
            .map((h: any) => ({ id: h.id, name: h.name, date: h.date, region: h.region }))
        : [],
      stats: {
        commandUsageTotal,
      },
    });
  } catch (error) {
    logError('Fehler bei Guild Overview', { functionName: 'apiGuildOverview', extra: { error, guildId } });
    return json(res, 500, { error: 'guild_overview_failed' });
  }
}

async function handleConsent(req: IncomingMessage, res: ServerResponse, guildId: string) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });
  if (!isGuildAllowed(guildId)) return json(res, 403, { error: 'forbidden' });

  if (req.method === 'GET') {
    const consent = await (prisma as any).userTrackingConsent.findUnique({
      where: { guildId_userId: { guildId, userId: session.user.id } },
    });
    return json(res, 200, { status: consent?.status ?? 'NONE', version: consent?.version ?? null });
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const status = body?.status as string;
      const version = typeof body?.version === 'string' ? body.version : null;
      if (!['NONE', 'ALLOWED', 'DENIED'].includes(status)) return json(res, 400, { error: 'invalid_status' });
      const result = await (prisma as any).userTrackingConsent.upsert({
        where: { guildId_userId: { guildId, userId: session.user.id } },
        update: { status, version: version ?? undefined },
        create: { guildId, userId: session.user.id, status, version },
      });
      return json(res, 200, { status: result.status, version: result.version });
    } catch (error) {
      logError('Consent speichern fehlgeschlagen', { functionName: 'apiConsent', extra: { error, guildId } });
      return json(res, 500, { error: 'consent_failed' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
}

async function handleUserProfile(req: IncomingMessage, res: ServerResponse) {
  const sessionId = getSession(req);
  if (!sessionId) return json(res, 401, { error: 'unauthorized' });
  const session = await loadSession(sessionId);
  if (!session) return json(res, 401, { error: 'unauthorized' });

  if (req.method === 'GET') {
    const profile = await (prisma as any).userProfile.findUnique({
      where: { userId: session.user.id },
      select: { birthday: true },
    });
    return json(res, 200, { birthday: profile?.birthday ?? null });
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const birthdayStr = body?.birthday;
      let birthday: Date | null = null;
      if (birthdayStr) {
        const parsed = new Date(birthdayStr);
        if (Number.isNaN(parsed.getTime())) return json(res, 400, { error: 'invalid_birthday' });
        birthday = parsed;
      }
      await (prisma as any).userProfile.upsert({
        where: { userId: session.user.id },
        update: { birthday },
        create: { userId: session.user.id, birthday },
      });
      return json(res, 200, { birthday });
    } catch (error) {
      logError('Profil speichern fehlgeschlagen', { functionName: 'apiProfile', extra: { error } });
      return json(res, 500, { error: 'profile_failed' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
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

    if (path === '/api/status' && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleStatus(res);
      return;
    }

    if (path === '/api/guilds' && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleGuilds(req, res);
      return;
    }

    const guildMeMatch = path.match(/^\/api\/guilds\/([^/]+)\/me$/);
    if (guildMeMatch && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleGuildMember(req, res, guildMeMatch[1]);
      return;
    }

    const guildOverviewMatch = path.match(/^\/api\/guilds\/([^/]+)\/overview$/);
    if (guildOverviewMatch && req.method === 'GET') {
      applySecurityHeaders(res);
      await handleGuildOverview(req, res, guildOverviewMatch[1]);
      return;
    }

    const guildConsentMatch = path.match(/^\/api\/guilds\/([^/]+)\/consent$/);
    if (guildConsentMatch && (req.method === 'GET' || req.method === 'POST')) {
      applySecurityHeaders(res);
      await handleConsent(req, res, guildConsentMatch[1]);
      return;
    }

    if (path === '/api/users/me/profile' && (req.method === 'GET' || req.method === 'POST')) {
      applySecurityHeaders(res);
      await handleUserProfile(req, res);
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

