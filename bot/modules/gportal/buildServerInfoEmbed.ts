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
    );

  if (live) {
    embed.addFields([
      {
        name: 'Serverauslastung',
        value: [
          getBarLine('👥 Spieler:', (live.players / live.maxPlayers) * 100, `${live.players.toString().padStart(2, '0')} / ${live.maxPlayers}`),
          getBarLine('🧠 CPU:', 74, '74 %'),       // Platzhalterwerte
          getBarLine('📦 RAM:', 62, '62 %'),       // du kannst später dynamisch erweitern
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
