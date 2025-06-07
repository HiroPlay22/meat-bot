// bot/modules/gportal/buildServerInfoEmbed.ts

import { EmbedBuilder } from 'discord.js';
import type { GportalServerConfig, LiveServerData } from './types.js';
import { getBarLine } from './getBarLine.js';
import { emoji } from '@/utils/meatEmojis.js';

export function buildServerInfoEmbed(config: GportalServerConfig, live: LiveServerData | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`💾 ${config.name} – ${config.game}`)
    .setColor(0x00ff88)
    .setDescription(
      `${emoji.meat_leer} Ping: ${live?.ping ?? '??'} ms\n` +
      `${emoji.meat_leer} Map: ${live?.map || 'unbekannt'}\n` +
      `${emoji.meat_roles} Zugriff: nur mit entsprechender Rolle`
    )
    .setImage(
      'https://media.discordapp.net/attachments/1374459199181951087/1379485079449112606/ChatGPT_Image_3._Juni_2025_17_20_29.png?ex=68450658&is=6843b4d8&hm=02b2016657f1a5ea65d82573da94dced8b94c73dc889d51530bbf896d0755303&=&format=webp&quality=lossless&width=1229&height=819'
    );

  if (live) {
    const lines = [
      getBarLine(`${emoji.meat_members} Spieler:`, (live.players / live.maxPlayers) * 100, `${live.players.toString().padStart(2, '0')} / ${live.maxPlayers}`),
      getBarLine(`${emoji.meat_hirn} CPU:`, 74, '74 %'),
      getBarLine(`${emoji.meat_ram} RAM:`, 62, '62 %'),
      getBarLine(`${emoji.meat_leer} Speicher:`, 60, '60 %')
    ];

    embed.addFields([
      {
        name: 'Serverauslastung',
        value: lines.join('\n'),
        inline: false
      }
    ]);
  } else {
    embed.setFooter({ text: 'Server ist aktuell nicht erreichbar.' });
  }

  return embed;
}
