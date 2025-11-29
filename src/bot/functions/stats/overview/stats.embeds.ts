// FILE: src/bot/functions/stats/overview/stats.embeds.ts

import {
  EmbedBuilder,
  type Guild,
  type User,
} from 'discord.js';
import { ladeTexte } from '../../../general/texts/text-loader.js';
import { emoji } from '../../../general/style/emoji.js';
import type { TrackingStatusTyp } from '../../sentinel/datenschutz/datenschutz.service.js';

// Texte für das Stats-Modul (deutsche Variante)
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
  textChannelCount: number;
  voiceChannelCount: number;
  roleCount: number;
  /**
   * totalCommandCount / topCommand* sind für später vorgesehen,
   * werden aktuell in diesem Embed nicht genutzt.
   */
  totalCommandCount?: number;
  topCommandName?: string;
  topCommandCount?: number;
}): EmbedBuilder {
  const {
    guild,
    memberCount,
    textChannelCount,
    voiceChannelCount,
    roleCount,
  } = options;

  const guildIcon =
    guild.iconURL({ size: 128 }) ??
    guild.client.user.displayAvatarURL({ size: 128 });

  const boostCount = guild.premiumSubscriptionCount ?? 0;
  const boostTier = guild.premiumTier; // 0–3
  const totalChannels = textChannelCount + voiceChannelCount;

  const createdAt = guild.createdAt;
  const createdDateFormatted = createdAt
    ? createdAt.toLocaleDateString('de-DE')
    : 'Unbekannt';

  const embed = new EmbedBuilder()
    .setAuthor({
      name: texte.views?.guild?.title ?? 'Server-Übersicht',
      iconURL: guildIcon,
    })
    .setDescription(
      texte.views?.guild?.description ??
        'Allgemeine M.E.A.T.-Statistiken für diesen Server.',
    )
    .setColor(0xff3366)
    .setThumbnail(guildIcon); // ➜ Bild wieder rechts als Thumbnail

  // Linke Spalte – mehrere Zeilen in EINEM Field
  const leftColumn = [
    `${emoji.meat_calendar} Erstellt \`${createdDateFormatted}\``,
    `${emoji.meat_members} Mitglieder \`${memberCount}\``,
    `${emoji.meat_boost} Boosts \`L${boostTier}·${boostCount}x\``,
    `${emoji.meat_roles} Rollen \`${roleCount}\``,
  ].join('\n');

  // Rechte Spalte – mehrere Zeilen in EINEM Field
  const rightColumn = [
    `${emoji.meat_channels} Kanäle \`${totalChannels}\``,
    `${emoji.meat_text} Text \`${textChannelCount}\``,
    `${emoji.meat_voice} Voice \`${voiceChannelCount}\``,
  ].join('\n');

  embed.addFields(
    {
      name: ' ',
      value: leftColumn,
      inline: true,
    },
    {
      name: ' ',
      value: rightColumn,
      inline: true,
    },
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
    .setTitle(
      `${
        texte.views?.commands?.title ?? 'Befehls-Statistiken'
      }`,
    )
    .setThumbnail(botAvatar)
    .setColor(0x33ccff);

  if (items.length === 0) {
    embed.setDescription(
      texte.views?.commands?.description ??
        'Nutzung der M.E.A.T.-Befehle auf diesem Server.',
    );
    embed.addFields({
      name: 'Hinweis',
      value:
        'Es liegen noch keine Befehlsdaten für diesen Server vor.',
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
      `${emoji.meat_dice ?? emoji.meat_commands} Aktivster Befehl: \`/${topItem.commandName}\` – **${topItem.count}x**.`,
  );

  const lines = items.map((item) => {
    const descPart = item.description
      ? ` – ${item.description}`
      : '';
    return `${emoji.meat_commands} \`/${item.commandName}\` – **${item.count}x**${descPart}`;
  });

  embed.addFields({
    name: 'Befehle',
    value: lines.join('\n'),
  });

  return embed;
}

// ---------------------------------------------------------
// Meine Stats-View
// ---------------------------------------------------------

export function baueMeineStatsEmbed(options: {
  user: User;
  trackingStatus: TrackingStatusTyp;
  items: MeineStatsItem[];
}): EmbedBuilder {
  const { user, trackingStatus, items } = options;

  const userAvatar = user.displayAvatarURL({ size: 128 });

  const embed = new EmbedBuilder()
    .setTitle(
      `${
        texte.views?.me?.title ?? 'Deine M.E.A.T.-Stats'
      }`,
    )
    .setThumbnail(userAvatar)
    .setColor(0x9966ff);

  // Kein Tracking erlaubt → nur Info & Hinweis
  if (trackingStatus !== 'allowed') {
    embed.setDescription(
      `${texte.views?.me?.noTracking ?? 'Keine persönlichen Statistiken verfügbar.'}\n\n${
        texte.views?.me?.hintDatenschutz ??
        'Du kannst deine Datenschutz-Einstellungen jederzeit anpassen.'
      }`,
    );
    return embed;
  }

  // Tracking erlaubt, aber keine Daten
  if (!items.length) {
    embed.setDescription(
      texte.views?.me?.noData ??
        'Es liegen noch keine Daten zu deinen Befehlen vor.',
    );
    return embed;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  embed.setDescription(
    `Du hast insgesamt **${total}** M.E.A.T.-Befehle auf diesem Server ausgeführt.`,
  );

  const lines = items.map((item) => {
    return `${emoji.meat_commands} \`/${item.commandName}\` – **${item.count}x**`;
  });

  embed.addFields({
    name: 'Deine Top-Befehle',
    value: lines.join('\n'),
  });

  return embed;
}
