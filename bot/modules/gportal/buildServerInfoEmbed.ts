import { EmbedBuilder } from 'discord.js';
import type { GportalServerConfig, LiveServerData } from './types.js';
import { getBarLineOnlyBar } from './getBarLine.js';
import { emoji } from '@/utils/meatEmojis.js';

export function buildServerInfoEmbed(config: GportalServerConfig, live: LiveServerData | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${config.name}`)
    .setColor(0x00ff88)
    .setDescription(
      `${emoji.meat_online} Ping: ${live?.ping ?? '??'} ms\n` +
      `${emoji.meat_game} Map: ${config.game}\n` +
      `${emoji.meat_leer} Map: ${live?.map || 'unbekannt'}\n` +
      `${emoji.meat_roles} Zugriff: nur mit entsprechender Rolle`
    )
    .setImage(
      'https://media.discordapp.net/attachments/1374459199181951087/1379485079449112606/ChatGPT_Image_3._Juni_2025_17_20_29.png?ex=68450658&is=6843b4d8&hm=02b2016657f1a5ea65d82573da94c73dc889d51530bbf896d0755303&=&format=webp&quality=lossless&width=1229&height=819'
    );

  if (live) {
    const labels = [
      `${emoji.meat_users} Spieler:`.padEnd(14),
      `${emoji.meat_leer} CPU:`.padEnd(14),
      `${emoji.meat_leer} RAM:`.padEnd(14),
      `${emoji.meat_leer} Speicher:`.padEnd(14)
    ];

    const bars = [
      `${getBarLineOnlyBar((live.players / live.maxPlayers) * 100)}  ${live.players.toString().padStart(2, '0')} / ${live.maxPlayers}`,
      `${getBarLineOnlyBar(74)}  74 %`,
      `${getBarLineOnlyBar(62)}  62 %`,
      `${getBarLineOnlyBar(60)}  60 %`
    ];

    const lines = labels.map((label, i) => `${label}${bars[i]}`);

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
