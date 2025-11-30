// FILE: src/bot/functions/welcome/welcome.listener.ts

import {
  Client,
  GuildMember,
  TextChannel,
  NewsChannel,
  ThreadChannel
} from 'discord.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ladeServerEinstellungen } from '../../general/config/server-settings-loader.js';
import type { WelcomeTexte } from './welcome.embeds.js';
import { erstelleWillkommensEmbed } from './welcome.embeds.js';

type TextChannelLike = TextChannel | NewsChannel | ThreadChannel;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedTexte: WelcomeTexte | null = null;

/**
 * Lädt und cached die Welcome-Texte aus texte.de.json
 */
async function ladeWelcomeTexte(): Promise<WelcomeTexte> {
  if (cachedTexte) return cachedTexte;

  const dateiPfad = join(__dirname, 'texte.de.json');
  const inhalt = await readFile(dateiPfad, 'utf-8');
  const json = JSON.parse(inhalt) as WelcomeTexte;

  cachedTexte = json;
  return json;
}

/**
 * Registriert den Listener für guildMemberAdd und versendet bei neuen
 * Mitgliedern ein Embed in den konfigurierten Welcome-Channel.
 * Bots werden getrennt behandelt (eigene Texte, oder komplett deaktiviert).
 */
export function registriereWelcomeListener(client: Client): void {
  client.on('guildMemberAdd', async (member: GuildMember) => {
    try {
      const settings = await ladeServerEinstellungen(member.guild.id);
      const welcomeConfig = settings.functions?.welcome;

      // Wenn Welcome-Funktion nicht aktiviert ist → nichts tun
      if (!welcomeConfig || !welcomeConfig.aktiv) {
        return;
      }

      const spezifisch = welcomeConfig.spezifisch ?? {};

      const welcomeChannelId = (spezifisch as any).welcomeChannelId as
        | string
        | undefined;
      const begruesseBots = (spezifisch as any).begruesseBots ?? true;

      // Bots ggf. komplett überspringen
      if (member.user.bot && !begruesseBots) {
        return;
      }

      if (!welcomeChannelId) {
        // kein Channel konfiguriert → nichts senden
        return;
      }

      const rawChannel = member.guild.channels.cache.get(welcomeChannelId);

      if (!rawChannel || !rawChannel.isTextBased()) {
        // Channel existiert nicht mehr oder ist kein Text-Channel → abbrechen
        return;
      }

      const channel = rawChannel as TextChannelLike;

      const texte = await ladeWelcomeTexte();
      const embed = erstelleWillkommensEmbed(member, texte);

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        '[WELCOME] Fehler beim Versenden der Willkommensnachricht:',
        error
      );
    }
  });
}
