// FILE: src/bot/functions/welcome/welcome.embeds.ts

import { EmbedBuilder, GuildMember } from 'discord.js';
import { emoji, safe } from '../../general/style/emoji.js';

export interface WelcomeTexte {
  embed: {
    titelUser: string;
    titelBot: string;
    memberCountZeile: string;
  };
  messages: {
    user: string[];
    bot: string[];
  };
}

/**
 * Platzhalter wie {mention} oder {memberNumber} im Text ersetzen.
 */
function ersetzePlatzhalter(
  vorlage: string,
  werte: Record<string, string>,
): string {
  return Object.entries(werte).reduce((text, [schluessel, wert]) => {
    const regex = new RegExp(`{${schluessel}}`, 'g');
    return text.replace(regex, wert);
  }, vorlage);
}

/**
 * Datum hübsch auf DE formatieren, z. B. "20. Juni 2025" (ohne Uhrzeit)
 */
function formatiereBeitrittsDatum(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Erstellt das Willkommens-Embed für einen neuen User oder Bot.
 * Layout:
 *  - Titel (aus texte.de.json: titelUser / titelBot)
 *  - Zitatblock mit Random-Text
 *  - Dreispaltige Infozeile ohne Überschriften:
 *      [user-icon] Name   |   [users-icon] #Nummer   |   [calendar-icon] Datum
 */
export function erstelleWillkommensEmbed(
  member: GuildMember,
  texte: WelcomeTexte,
): EmbedBuilder {
  const istBot = member.user.bot;

  const memberNummer = member.guild.memberCount;

  const joinDate =
    member.joinedAt instanceof Date ? member.joinedAt : new Date();
  const joinDateText = formatiereBeitrittsDatum(joinDate);

  const platzhalter = {
    mention: `<@${member.id}>`,
    username: member.user.username,
    displayName: member.displayName,
    tag: member.user.tag,
    memberNumber: memberNummer.toString(),
    serverName: member.guild.name,
  };

  const nachrichtenListe = istBot ? texte.messages.bot : texte.messages.user;

  const begruessungsTextVorlage =
    nachrichtenListe.length > 0
      ? nachrichtenListe[Math.floor(Math.random() * nachrichtenListe.length)]
      : '{mention} ist beigetreten.';

  const begruessungsText = ersetzePlatzhalter(
    begruessungsTextVorlage,
    platzhalter,
  );

  // Titel aus den Texten (kann {displayName} / {serverName} etc. enthalten)
  const titelVorlage = istBot ? texte.embed.titelBot : texte.embed.titelUser;
  const titel = ersetzePlatzhalter(titelVorlage, platzhalter);

  const nameIcon = safe(emoji.meat_members);
  const nummerIcon = safe(emoji.meat_users);
  const datumIcon = safe(emoji.meat_calendar);

  // Zitatblock (ohne extra "Willkommen"-Zeile)
  const quoteBlock = begruessungsText
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

  const beschreibung = `${quoteBlock}`;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2) // später via Style-System
    .setTitle(titel)
    .setDescription(beschreibung)
    .setThumbnail(
      member.user.displayAvatarURL({
        extension: 'png',
        size: 256,
      }),
    )
    .addFields(
      {
        name: '\u200b',
        value: `${nameIcon} ${platzhalter.displayName || platzhalter.username}`,
        inline: true,
      },
      {
        name: '\u200b',
        value: `${nummerIcon} #${platzhalter.memberNumber}`,
        inline: true,
      },
      {
        name: '\u200b',
        value: `${datumIcon} ${joinDateText}`,
        inline: true,
      },
    );

  return embed;
}
