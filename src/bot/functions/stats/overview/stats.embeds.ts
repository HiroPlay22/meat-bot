// FILE: src/bot/functions/stats/overview/stats.embeds.ts

import { EmbedBuilder, type Guild, type GuildMember, type User } from 'discord.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import { emoji, safe } from '../../../general/style/emoji.js';
import type { TrackingStatusTyp } from '../../sentinel/datenschutz/datenschutz.service.js';
import type { MontagStats } from '../polls/montag/montag.stats.js';

// Texte fuer das Stats-Modul (deutsche Variante)
const texte = ladeTexte('stats/overview', 'de');

type CommandStatItem = {
  commandName: string;
  description?: string;
  count: number;
};

type MeineStatsItem = {
  commandName: string;
  count: number;
};

export function baueGuildStatsEmbed(options: {
  guild: Guild;
  memberCount: number;
  botCount: number;
  textChannelCount: number;
  voiceChannelCount: number;
  roleCount: number;
  totalCommandCount?: number;
  topCommandName?: string;
  topCommandCount?: number;
}): EmbedBuilder {
  const {
    guild,
    memberCount,
    botCount,
    textChannelCount,
    voiceChannelCount,
    roleCount,
  } = options;

  const guildIcon =
    guild.iconURL({ size: 128 }) ??
    guild.client.user.displayAvatarURL({ size: 128 });

  const boostCount = guild.premiumSubscriptionCount ?? 0;
  const boostTier = guild.premiumTier;
  const totalChannels = textChannelCount + voiceChannelCount;
  const createdAt = guild.createdAt;
  const createdDateFormatted = createdAt
    ? createdAt.toLocaleDateString('de-DE')
    : 'Unbekannt';

  const embed = new EmbedBuilder()
    .setAuthor({
      name: texte.views?.guild?.title ?? 'Server-Uebersicht',
      iconURL: guildIcon,
    })
    .setDescription(
      texte.views?.guild?.description ??
        'Allgemeine M.E.A.T.-Statistiken fuer diesen Server.',
    )
    .setColor(0xff3366)
    .setThumbnail(guildIcon);

  const leftColumn = [
    `${emoji.meat_calendar} Erstellt \`${createdDateFormatted}\``,
    `${emoji.meat_members} Mitglieder \`${memberCount}\``,
    `${emoji.meat_dev} Bots \`${botCount}\``,
    `${emoji.meat_boost} Boosts \`${boostCount} \u00b7 lvl${boostTier}\``,
  ].join('\n');

  const rightColumn = [
    `${emoji.meat_roles} Rollen \`${roleCount}\``,
    `${emoji.meat_channels} Kanäle \`${totalChannels}\``,
    `${emoji.meat_text} Text \`${textChannelCount}\``,
    `${emoji.meat_voice} Voice \`${voiceChannelCount}\``,
  ].join('\n');

  embed.addFields(
    { name: ' ', value: leftColumn, inline: true },
    { name: ' ', value: rightColumn, inline: true },
  );

  return embed;
}

// ---------------------------------------------------------
// Commands-View (Liste der Befehle + Zusammenfassung)
// ---------------------------------------------------------

export function baueCommandsStatsEmbed(options: {
  guild: Guild;
  items: CommandStatItem[];
}): EmbedBuilder {
  const { guild, items } = options;

  const botAvatar = guild.client.user.displayAvatarURL({ size: 128 });

  const embed = new EmbedBuilder()
    .setTitle(texte.views?.commands?.title ?? 'Befehls-Statistiken')
    .setThumbnail(botAvatar)
    .setColor(0x33ccff);

  if (items.length === 0) {
    embed.setDescription(
      texte.views?.commands?.description ??
        'Nutzung der M.E.A.T.-Befehle auf diesem Server.',
    );
    embed.addFields({
      name: 'Hinweis',
      value: 'Es liegen noch keine Befehlsdaten fuer diesen Server vor.',
    });
    return embed;
  }

  const totalUses = items.reduce((sum, item) => sum + item.count, 0);
  const topItem = items.reduce((best, current) =>
    current.count > best.count ? current : best,
  );

  const descriptionBase =
    texte.views?.commands?.description ??
    'Nutzung der M.E.A.T.-Befehle auf diesem Server.';

  embed.setDescription(
    `${descriptionBase}\n\n` +
      `${emoji.meat_commands} Insgesamt wurden auf diesem Server **${totalUses}** Befehle ausgeführt.\n` +
      `${emoji.meat_dice ?? emoji.meat_commands} Aktivster Befehl: \`/${topItem.commandName}\` - **${topItem.count}x**.`,
  );

  const lines = items.map((item) => {
    const descPart = item.description ? ` - ${item.description}` : '';
    return `${emoji.meat_commands} \`/${item.commandName}\` - \`${item.count}x\`${descPart}`;
  });

  const half = Math.ceil(lines.length / 2);
  const left = lines.slice(0, half);
  const right = lines.slice(half);

  embed.addFields(
    { name: 'Befehle', value: left.join('\n'), inline: true },
    {
      name: ' ',
      value: right.length ? right.join('\n') : '\u200b',
      inline: true,
    },
  );

  return embed;
}

// ---------------------------------------------------------
// Meine Stats-View
// ---------------------------------------------------------

export function baueMeineStatsEmbed(options: {
  user: User;
  member?: GuildMember;
  trackingStatus: TrackingStatusTyp;
  items: MeineStatsItem[];
  activity: { messageCount: number; voiceSeconds: number };
}): EmbedBuilder {
  const { user, member, trackingStatus, items, activity } = options;

  const userAvatar = user.displayAvatarURL({ size: 128 });
  const displayName = member?.displayName ?? user.username;

  const embed = new EmbedBuilder()
    .setTitle(texte.views?.me?.title ?? 'Deine M.E.A.T.-Stats')
    .setThumbnail(userAvatar)
    .setColor(0x9966ff);

  if (trackingStatus !== 'allowed') {
    embed.setDescription(
      `${texte.views?.me?.noTracking ?? 'Keine persoenlichen Statistiken verfuegbar.'}\n\n${
        texte.views?.me?.hintDatenschutz ??
        'Du kannst deine Datenschutz-Einstellungen jederzeit anpassen.'
      }`,
    );
    return embed;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);
  const commandLines =
    items.length > 0
      ? items.map(
          (item) =>
            `${emoji.meat_commands} \`/${item.commandName}\` - \`${item.count}x\``,
        )
      : ['Keine Befehlsdaten vorhanden.'];

  const voiceFormatted =
    activity.voiceSeconds >= 3600
      ? `${(activity.voiceSeconds / 3600).toFixed(1)}h`
      : `${Math.round(activity.voiceSeconds / 60)}m`;

  embed.setDescription(
    `Du hast insgesamt **${total}** M.E.A.T.-Befehle auf diesem Server ausgefuehrt.`,
  );

  const createdDate =
    user.createdAt?.toLocaleDateString('de-DE') ?? 'unbekannt';
  const joinedDate =
    member?.joinedAt?.toLocaleDateString('de-DE') ?? 'unbekannt';
  const boostSince =
    member?.premiumSince?.toLocaleDateString('de-DE') ?? 'kein Booster';

  const rollen =
    member?.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}>`)
      .join(' ') || 'Keine Rollen bekannt.';

  embed.addFields(
    {
      name: `${displayName}'s Top-Befehle`,
      value: commandLines.join('\n'),
      inline: true,
    },
    {
      name: `${displayName}'s Stats`,
      value: [
        `${emoji.meat_calendar} Erstellt \`${createdDate}\``,
        `${emoji.meat_members} Beitritt \`${joinedDate}\``,
        `${emoji.meat_boost} Booster seit \`${boostSince}\``,
        `${emoji.meat_text} Nachrichten \`${activity.messageCount}\``,
        `${emoji.meat_voice} Voice \`${voiceFormatted}\``,
      ].join('\n'),
      inline: true,
    },
    {
      name: `${emoji.meat_roles} Rollen`,
      value: rollen,
      inline: false,
    },
  );

  return embed;
}

// ---------------------------------------------------------
// Montagsrunde Stats
// ---------------------------------------------------------

export function baueMontagStatsEmbed(options: {
  guild: Guild;
  stats: MontagStats;
}): EmbedBuilder {
  const { guild, stats } = options;
  const iconGame = safe(emoji.meat_game);
  const iconDb = safe((emoji as Record<string, string>).meat_db ?? emoji.meat_servers);
  const iconNew = safe((emoji as Record<string, string>).meat_memory ?? emoji.meat_game);

  const embed = new EmbedBuilder()
    .setTitle(`Montagsrunde Stats - ${guild.name}`)
    .setColor(0x579326)
    .setDescription(`${iconDb} Spiele in der DB: \`${stats.gameCount}\``);

  const topLines =
    stats.topWins.length > 0
      ? stats.topWins.map((g) => {
          const badges = [g.winCount > 0 ? `${g.winCount}x` : null].filter(Boolean);
          const badge = badges.length ? `\`${badges.join(' | ')}\`` : '';
          return `${iconGame} ${g.name}${badge ? ' ' + badge : ''}`;
        })
      : ['Noch keine Gewinner ermittelt.'];

  const newestLines =
    stats.newest.length > 0
      ? stats.newest.map((g) => {
          const badgeParts: string[] = [];
          if (g.isFree) {
            badgeParts.push('F2P');
          }
          const badge = badgeParts.length ? `\`${badgeParts.join(' | ')}\`` : '';
          return `${iconNew} ${g.name}${badge ? ' ' + badge : ''}`;
        })
      : ['Keine neuen Spiele vorhanden.'];

  embed.addFields(
    {
      name: 'Top 5 Montags-Games',
      value: topLines.join('\n'),
      inline: true,
    },
    {
      name: 'Neu hinzugefuegt',
      value: newestLines.join('\n'),
      inline: true,
    },
  );

  return embed;
}
