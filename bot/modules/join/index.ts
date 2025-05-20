// modules/join/index.ts

import { GuildMember, TextChannel } from 'discord.js';
import { buildJoinEmbed } from './embed.js';
import { sendWelcomeDM } from './dm.js'; // ⬅️ NEU
import serverSettings from '@config/serverSettings.json' with { type: 'json' };

type ServerSettings = {
  guilds: {
    [guildId: string]: {
      joinChannelId?: string;
    };
  };
};

const settings = serverSettings as ServerSettings;

export async function handleMemberJoin(member: GuildMember) {
  const guildId = member.guild.id;
  const config = settings.guilds[guildId];

  if (!config || !config.joinChannelId) return;

  const channel = member.guild.channels.cache.get(config.joinChannelId);
  if (!channel || !channel.isTextBased()) return;

  const { embed, reactions } = buildJoinEmbed(member);

  try {
    const message = await (channel as TextChannel).send({ embeds: [embed] });

    for (const emoji of reactions) {
      await message.react(emoji);
    }

    // 💌 Willkommensnachricht per DM senden
    await sendWelcomeDM(member);

  } catch (error) {
    console.error(`[MEAT] Fehler beim Join-Handling:`, error);
  }
}
