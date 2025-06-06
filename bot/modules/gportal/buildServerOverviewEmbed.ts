import { EmbedBuilder } from 'discord.js';

export function buildServerOverviewEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('M.E.A.T. 💚 GPORTAL')
    .setDescription([
      'Unsere aktiven Community-Server.',
      'Wähle unten einen Server aus, um mehr Infos zu erhalten.'
    ].join('\n'))
    .setImage('https://your.image.url/here.webp') // <- dein GPORTAL-Banner
    .setColor(0x00ff88);
}
