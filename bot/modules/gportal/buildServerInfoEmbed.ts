// bot/modules/gportal/buildServerInfoEmbed.ts

import { EmbedBuilder } from 'discord.js';
import type { GportalServerConfig, LiveServerData } from './types.js';
import { getBarLineOnlyBar } from './getBarLine.js';
import { emoji } from '@/utils/meatEmojis.js';

export function buildServerInfoEmbed(config: GportalServerConfig, live: LiveServerData | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${config.name}`)
    .setColor(0x00ff88)
    .setImage(
      'https://media.discordapp.net/attachments/1374459199181951087/1379485079449112606/ChatGPT_Image_3._Juni_2025_17_20_29.png?ex=68450658&is=6843b4d8&hm=02b2016657f1a5ea65d82573da94dced8b94c73dc889d51530bbf896d0755303&=&format=webp&quality=lossless&width=1229&height=819'
    );

  const descLines: string[] = [];

  if (live?.ping !== undefined) {
    descLines.push(`${emoji.meat_online} Ping: ${live.ping} ms`);
  }

  if (config.game) {
    descLines.push(`${emoji.meat_game} Game: ${config.game}`);
  }

  if (live?.map) {
    descLines.push(`${emoji.meat_leer} Map: ${live.map}`);
  }

  descLines.push(`${emoji.meat_roles} Zugriff: nur mit entsprechender Rolle`);
  embed.setDescription(descLines.join('\n'));

  // Spieleranzeige nur wenn live.players und config.maxPlayers verfügbar sind
  const hasValidPlayerData =
    typeof live?.players === 'number' &&
    typeof config.maxPlayers === 'number';

  if (hasValidPlayerData) {
    const max = config.maxPlayers!;
    const percentage = (live.players / max) * 100;
    const bar = getBarLineOnlyBar(percentage);
    const valueText = `${live.players.toString().padStart(2, '0')} / ${max}`;

    embed.addFields([
      { name: ' ', value: `${emoji.meat_users} Spieler:`, inline: true },
      { name: ' ', value: `${bar}  ${valueText}`, inline: true }
    ]);
  } else {
    embed.setFooter({ text: 'Server ist aktuell nicht erreichbar oder nicht vollständig konfiguriert.' });
  }

  return embed;
}
