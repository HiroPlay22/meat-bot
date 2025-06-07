import { EmbedBuilder } from 'discord.js';

export function buildServerOverviewEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('M.E.A.T. 💚 GPORTAL')
    .setDescription([
      'Unsere aktiven Community-Server.',
      'Wähle unten einen Server aus, um mehr Infos zu erhalten.'
    ].join('\n'))
    .setImage('https://media.discordapp.net/attachments/1374459199181951087/1379485079449112606/ChatGPT_Image_3._Juni_2025_17_20_29.png?ex=68450658&is=6843b4d8&hm=02b2016657f1a5ea65d82573da94dced8b94c73dc889d51530bbf896d0755303&=&format=webp&quality=lossless&width=1229&height=819')
    .setColor(0x00ff88);
}
