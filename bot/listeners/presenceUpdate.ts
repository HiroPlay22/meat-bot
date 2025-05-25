import {
  Events,
  type Presence,
  type TextChannel
} from 'discord.js';
import { extractStreamingActivity } from '@/modules/live/extractStreamingActivity.js';
import { buildStreamEmbed } from '@/modules/live/buildStreamEmbed.js';
import serverSettings from '@config/serverSettings.json' with { type: 'json' };
import { emoji } from '@/utils/meatEmojis.js';

// 🕒 Cooldown-System: max 1 Auto-Post alle 2 Stunden pro User
const streamCooldowns = new Map<string, number>();
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 Stunden

export default {
  name: Events.PresenceUpdate,
  async execute(oldPresence: Presence | null, newPresence: Presence) {
    const user = newPresence.user;
    if (!user) return;

    const guildId = newPresence.guild?.id;
    if (!guildId) return;

    const guildSettings = serverSettings.guilds[guildId as keyof typeof serverSettings.guilds];
    if (!guildSettings?.allowedLiveRoles) return;

    const allowedRoles: string[] = guildSettings.allowedLiveRoles;
    const member = newPresence.member;
    if (!member) return;

    // ⛔ Nur wenn NICHT offline
    if (newPresence.status === 'offline') return;

    // 🛡️ Nur weitermachen, wenn der User mindestens eine erlaubte Rolle hat
    const hasAllowedRole = allowedRoles.some(roleId => member.roles.cache.has(roleId));
    if (!hasAllowedRole) return;

    console.log(`[DEBUG] Präsenz-Update von: ${user.username}`);

    const activity = extractStreamingActivity(newPresence);
    if (!activity) {
      console.log('[DEBUG] → Keine Streaming-Aktivität erkannt.');
      return;
    }

    const lastPost = streamCooldowns.get(user.id);
    const now = Date.now();
    if (lastPost && now - lastPost < COOLDOWN_MS) {
      console.log(`[DEBUG] Cooldown aktiv für ${user.username}`);
      return;
    }

    streamCooldowns.set(user.id, now);

    const liveChannel = newPresence.client.channels.cache.get(guildSettings.liveChannelId);
    if (!liveChannel || !liveChannel.isTextBased() || !('send' in liveChannel)) return;

    const textChannel = liveChannel as TextChannel;
    const embedWithButton = await buildStreamEmbed(user, activity);
    await textChannel.send(embedWithButton);
    console.log(`[DEBUG] ➤ Embed gesendet für ${user.username} in #${guildSettings.liveChannelId}`);

    // 📣 Log-Nachricht
    const logChannelId = serverSettings.logChannelId;
    const logChannel = newPresence.client.channels.cache.get(logChannelId);

    if (logChannel && logChannel.isTextBased() && 'send' in logChannel) {
      const mention = `<@${user.id}>`;
      const liveChannelMention = `<#${guildSettings.liveChannelId}>`;

      await logChannel.send(
        `📣 ${mention} wurde automatisch als 🔴LIVE erkannt und im Channel ${liveChannelMention} angekündigt.`
      );
    }
  },
};
