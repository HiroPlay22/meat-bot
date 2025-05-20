// File: commands/general/info.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';
import raw from '@config/serverSettings.json' with { type: 'json' };
import { emoji, safe } from '@/utils/meatEmojis.js';

type GuildSettings = {
  modCategoryId: string;
  dinonameSuggestionChannelId: string;
  feedbackChannelId: string;
  joinChannelId: string;
  allowedPollRoles: string[];
  allowAnonymousFeedback: boolean;
  welcomeChannels: {
    rules: string;
    firstText: string;
    firstVoice: string;
    extraInfo: string;
    starterChannel: string;
  };
  highlightRoles?: string[];
  highlightChannels?: string[];
};

type ServerSettings = {
  guilds: Record<string, GuildSettings>;
};

const serverSettings: ServerSettings = raw;

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Zeigt alle wichtigen Infos über diesen Server.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({
      content: 'Dieser Command kann nur auf einem Server verwendet werden.',
      ephemeral: true,
    });
  }

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  const owner = await guild.fetchOwner().catch(() => null);
  const settings = serverSettings.guilds?.[guild.id] || {};

  const bots = (await guild.members.fetch())
    .filter((m) => m.user.bot)
    .sort((a, b) => {
      if (a.user.username.toLowerCase() === 'm.e.a.t.') return -1;
      if (b.user.username.toLowerCase() === 'm.e.a.t.') return 1;
      return a.user.username.localeCompare(b.user.username);
    });

  const botListBadges = bots
    .map((b) => `\`${b.user.username}\``)
    .reduce((acc: string[], curr, i) => {
      const row = Math.floor(i / 3);
      if (!acc[row]) acc[row] = curr;
      else acc[row] += ' ' + curr;
      return acc;
    }, [])
    .join('\n') || '–';

  const joinedAt = member?.joinedAt;
  const joinedDate = joinedAt?.toLocaleDateString() || '–';

  const importantRoles = settings.highlightRoles
    ?.map((id) => guild.roles.cache.get(id))
    .filter((r) => r)
    .map((r) => r!.toString())
    .join(' ') || '–';

  const importantChannels = settings.highlightChannels
    ?.map((id) => {
      const c = guild.channels.cache.get(id);
      if (!c) return null;
      return `<#${c.id}>`;
    })
    .filter(Boolean)
    .join('\n') || '–';

  const description = guild.description || 'Keine Beschreibung vorhanden.';
  const banner = guild.bannerURL({ size: 2048 });
  const icon = guild.iconURL({ size: 256 });

  const embed = new EmbedBuilder()
    .setTitle(`🎮 ${guild.name} Info`)
    .setDescription(description)
    .setImage(banner || null)
    .addFields(
      {
        name: '\u200b',
        value: [
          `${safe(emoji.meat_website)} Servername: ${guild.name}`,
          `${safe(emoji.meat_boss)} Besitzer: ${owner?.displayName || 'Unbekannt'}`,
          `${safe(emoji.meat_members)} Mitglieder: \`${guild.memberCount}\``,
          `${safe(emoji.meat_boost)} Boost-Level: \`Tier ${guild.premiumTier}\``,
          `${safe(emoji.meat_boost)} Boosts: \`${guild.premiumSubscriptionCount ?? 0}\``,
          `${safe(emoji.meat_roles)} Rollen: \`${guild.roles.cache.size}\``,
          `${safe(emoji.meat_text)} Textkanäle: \`${guild.channels.cache.filter(c => c.type === 0).size}\``,
          `${safe(emoji.meat_voice)} Voicekanäle: \`${guild.channels.cache.filter(c => c.type === 2).size}\``,
          `${safe(emoji.meat_threads)} Threads: \`${guild.channels.cache.filter(c => c.isThread()).size}\``
        ].join('\n'),
        inline: true
      },
      {
        name: '\u200b',
        value: [
          `${safe(emoji.meat_calendar)} Erstellt am: \`${guild.createdAt.toLocaleDateString()}\``,
          `${safe(emoji.meat_users)} Beigetreten: \`${joinedDate}\``,
          `${safe(emoji.meat_lock)} Sicherheitsstufe: \`${guild.verificationLevel}\``,
          `${safe(emoji.meat_lock)} 2FA-Schutz: \`${guild.mfaLevel === 1 ? 'Aktiv' : 'Inaktiv'}\``,
          `${safe(emoji.meat_nsfw)} NSFW-Stufe: \`${guild.nsfwLevel}\``,
          `${safe(emoji.meat_afk)} AFK-Timeout: \`${guild.afkTimeout / 60} Min\``,
          `${safe(emoji.meat_channels)} Emojis: \`${guild.emojis.cache.size}\``
        ].join('\n'),
        inline: true
      },
      {
        name: `${safe(emoji.meat_text)} Wichtige Channel`,
        value: importantChannels,
        inline: false
      },
      {
        name: `${safe(emoji.meat_roles)} Wichtige Rollen`,
        value: importantRoles,
        inline: false
      },
      {
        name: `${safe(emoji.meat_avatar)} Bots`,
        value: botListBadges,
        inline: false
      }
    );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('open_stats')
      .setLabel('Stats öffnen')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('open_feedback_modal')
      .setLabel('Feedback senden')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('disabled_help')
      .setLabel('Hilfe')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  await interaction.reply({ embeds: [embed], components: [buttons] });
}
