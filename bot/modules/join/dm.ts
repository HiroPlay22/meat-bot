import { GuildMember } from 'discord.js';
import { getJoinReaction } from './data.js';
import { emoji } from '@/utils/meatEmojis.js';
import serverSettings from '@config/serverSettings.json' with { type: 'json' };

type ServerSettings = {
  guilds: {
    [guildId: string]: {
      welcomeChannels?: {
        rules?: string;
        firstText?: string;
        firstVoice?: string;
        extraInfo?: string;
        starterChannel?: string;
      };
    };
  };
};

const settings = serverSettings as ServerSettings;

export async function sendWelcomeDM(member: GuildMember) {
  if (member.user.bot) return;

  const guildId = member.guild.id;
  const config = settings.guilds[guildId];

  const serverName = member.guild.name;
  const memberCount = member.guild.memberCount;
  const username = member.user.username;
  const reaction = getJoinReaction(false);

  const rulesLink = config?.welcomeChannels?.rules
    ? `<#${config.welcomeChannels.rules}>`
    : '`#regeln`';

  const firstTextLink = config?.welcomeChannels?.firstText
    ? `<#${config.welcomeChannels.firstText}>`
    : '`#text-start`';

  const firstVoiceLink = config?.welcomeChannels?.firstVoice
    ? `<#${config.welcomeChannels.firstVoice}>`
    : '`🔊 voice`';

  const extraInfoLink = config?.welcomeChannels?.extraInfo
    ? `<#${config.welcomeChannels.extraInfo}>`
    : '`#infos`';

  const starterChannelLink = config?.welcomeChannels?.starterChannel
    ? `<#${config.welcomeChannels.starterChannel}>`
    : '`#start-hier`';

  const message = [
    `${emoji.meat_avatar} **Willkommen auf ${serverName}, ${username}!**`,
    ``,
    `${emoji.meat_members} Du bist jetzt Crewmitglied **#${memberCount}**.`,
    `${emoji.meat_calendar} Dein Beitritt: <t:${Math.floor(Date.now() / 1000)}:D>`,
    ``,
    `${emoji.meat_text} **Wichtig:**`,
    `${rulesLink}`,
    `*Lese als erstes die Regeln!*`,
    `*Akzeptiere die Regeln mit der ✅ Reaktion.*`,
    ``,
    `${emoji.meat_voice} Danach kannst du hier durchstarten:`,
    `${extraInfoLink}`,
    `${starterChannelLink}`,
    `${firstTextLink}`,
    `${firstVoiceLink}`,
    ``,
    `> ${reaction}`,
    ``,
    `Viel Spaß beim Chatten und Zocken!`
  ].join('\n');

  try {
    await member.send({ content: message });
  } catch (err) {
    console.warn(`[MEAT] Konnte ${username} keine Willkommens-DM senden.`);
  }
}
