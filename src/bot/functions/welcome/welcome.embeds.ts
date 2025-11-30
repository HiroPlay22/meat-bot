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
  werte: Record<string, string>
): string {
  return Object.entries(werte).reduce((text, [schluessel, wert]) => {
    const regex = new RegExp(`{${schluessel}}`, 'g');
    return text.replace(regex, wert);
  }, vorlage);
}

/**
 * Erstellt das Willkommens-Embed für einen neuen User oder Bot.
 */
export function erstelleWillkommensEmbed(
  member: GuildMember,
  texte: WelcomeTexte
): EmbedBuilder {
  const istBot = member.user.bot;

  const memberNummer = member.guild.memberCount;

  const platzhalter = {
    mention: `<@${member.id}>`,
    username: member.user.username,
    tag: member.user.tag,
    memberNumber: memberNummer.toString()
  };

  const nachrichtenListe = istBot ? texte.messages.bot : texte.messages.user;

  const begruessungsTextVorlage =
    nachrichtenListe.length > 0
      ? nachrichtenListe[Math.floor(Math.random() * nachrichtenListe.length)]
      : '{mention} ist beigetreten.';

  const begruessungsText = ersetzePlatzhalter(
    begruessungsTextVorlage,
    platzhalter
  );

  const memberCountZeile = ersetzePlatzhalter(
    texte.embed.memberCountZeile,
    platzhalter
  );

  const titel = istBot ? texte.embed.titelBot : texte.embed.titelUser;

  // Icon aus deiner emoji-Datei für "wie viele User bist du?"
  const memberCountIcon = safe(emoji.meat_members);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2) // später gern durch dein zentrales Style-System ersetzen
    .setTitle(titel)
    .setDescription(
      `${begruessungsText}\n\n${memberCountIcon} ${memberCountZeile}`
    )
    .setThumbnail(
      member.user.displayAvatarURL({
        extension: 'png',
        size: 256
      })
    );

  return embed;
}
