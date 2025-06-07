import { EmbedBuilder } from 'discord.js';
import type { GportalServerConfig, LiveServerData } from './types.js';
import { getBarLine } from './getBarLine.js';

export function buildServerInfoEmbed(config: GportalServerConfig, live: LiveServerData | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`💾 ${config.name} – ${config.game}`)
    .setColor(0x00ff88)
    .setDescription(
      `📍 Standort: ${config.location || 'unbekannt'}\n` +
      `📶 Ping: ${live?.ping ?? '??'} ms\n` +
      `🗺️ Map: ${live?.map || 'unbekannt'}\n` +
      `🌐 Zugriff: nur mit entsprechender Rolle`
    )
    .setThumbnail('https://media.discordapp.net/attachments/1374459199181951087/1379485080128585819/ChatGPT_Image_3._Juni_2025_17_18_04.png?ex=68450658&is=6843b4d8&hm=7f6446580d615e1ce6d81abcbf4356c8240d5ea9c5df38db0e03edda2188fc8f&=&format=webp&quality=lossless&width=819&height=819');

  if (live) {
    embed.addFields([
      {
        name: 'Serverauslastung',
        value: [
          getBarLine('👥 Spieler:', (live.players / live.maxPlayers) * 100, `${live.players.toString().padStart(2, '0')} / ${live.maxPlayers}`),
          getBarLine('🧠 CPU:', 74, '74 %'),
          getBarLine('📦 RAM:', 62, '62 %'),
          getBarLine('💽 Speicher:', 60, '60 %')
        ].join('\n'),
        inline: false
      }
    ]);
  } else {
    embed.setFooter({ text: 'Server ist aktuell nicht erreichbar.' });
  }

  return embed;
}
