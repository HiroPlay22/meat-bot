// FILE: src/bot/commands/dev/welcomeTest.ts

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  NewsChannel,
  ThreadChannel,
} from 'discord.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';

import type { SlashCommand } from '../../types/SlashCommand.js';
import { ladeServerEinstellungen } from '../../general/config/server-settings-loader.js';
import {
  logInfo,
  logWarn,
  logError,
} from '../../general/logging/logger.js';
import {
  erstelleWillkommensEmbed,
  type WelcomeTexte,
} from '../../functions/welcome/welcome.embeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type TextChannelLike = TextChannel | NewsChannel | ThreadChannel;

let cachedTexte: WelcomeTexte | null = null;

/**
 * Lädt und cached die Welcome-Texte aus texte.de.json
 */
async function ladeWelcomeTexte(): Promise<WelcomeTexte> {
  if (cachedTexte) return cachedTexte;

  const dateiPfad = join(__dirname, '../../functions/welcome/texte.de.json');
  const inhalt = await readFile(dateiPfad, 'utf-8');
  const json = JSON.parse(inhalt) as WelcomeTexte;

  cachedTexte = json;
  return json;
}

export const welcomeTestCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('welcome-test')
    .setDescription('Sendet eine Test-Willkommensnachricht für dich.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  /**
   * Führt den Test-Command aus.
   * Nutzt die Welcome-Settings und -Texte und sendet ein Embed,
   * als wärst du gerade frisch gejoint.
   */
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'Dieser Command kann nur in einem Server verwendet werden.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guildId = interaction.guild.id;
      const settings = await ladeServerEinstellungen(guildId);
      const welcomeConfig = settings.functions?.welcome;

      if (!welcomeConfig || !welcomeConfig.aktiv) {
        logWarn(
          'welcome-test: Welcome-Funktion auf diesem Server deaktiviert.',
          {
            functionName: 'welcome-test',
            guildId,
            userId: interaction.user.id,
          },
        );

        await interaction.editReply(
          'Die Welcome-Funktion ist auf diesem Server aktuell **deaktiviert**. Aktiviere sie in den `serverSettings`.',
        );
        return;
      }

      const spezifisch = welcomeConfig.spezifisch ?? {};
      const welcomeChannelId = (spezifisch as any).welcomeChannelId as
        | string
        | undefined;

      const member = await interaction.guild.members.fetch(
        interaction.user.id,
      );

      const texte = await ladeWelcomeTexte();
      const embed = erstelleWillkommensEmbed(member, texte);

      let zielChannel: TextChannelLike | null = null;

      if (welcomeChannelId) {
        const rawChannel =
          interaction.guild.channels.cache.get(welcomeChannelId);
        if (rawChannel && rawChannel.isTextBased()) {
          zielChannel = rawChannel as TextChannelLike;
        }
      }

      if (zielChannel) {
        await zielChannel.send({ embeds: [embed] });

        logInfo(
          'welcome-test: Test-Embed im konfigurierten Welcome-Channel gesendet.',
          {
            functionName: 'welcome-test',
            guildId,
            userId: interaction.user.id,
            channelId: zielChannel.id,
          },
        );

        await interaction.editReply(
          `Test-Willkommensnachricht wurde im konfigurierten Channel <#${zielChannel.id}> gesendet.`,
        );
      } else {
        // Fallback: aktueller Channel (mit Type-Cast nach Text-Check)
        if (!interaction.channel || !interaction.channel.isTextBased()) {
          await interaction.editReply(
            'Es ist kein gültiger Welcome-Channel konfiguriert und dieser Channel ist nicht textbasiert. Nix zu machen.',
          );
          return;
        }

        const fallbackChannel = interaction.channel as TextChannelLike;

        await fallbackChannel.send({ embeds: [embed] });

        logWarn(
          'welcome-test: Kein gültiger Welcome-Channel konfiguriert, Fallback auf aktuellen Channel.',
          {
            functionName: 'welcome-test',
            guildId,
            userId: interaction.user.id,
            channelId: fallbackChannel.id,
          },
        );

        await interaction.editReply(
          'Kein gültiger Welcome-Channel konfiguriert – Test-Willkommensnachricht wurde in **diesem** Channel gesendet.',
        );
      }
    } catch (error) {
      logError('Fehler im /welcome-test Command', {
        functionName: 'welcome-test',
        guildId: interaction.guild?.id,
        userId: interaction.user.id,
        extra: { error },
      });

      try {
        await interaction.editReply(
          'Uff. Beim Testen der Welcome-Funktion ist etwas schiefgelaufen. Schau mal in die Logs.',
        );
      } catch {
        // Ignorieren
      }
    }
  },
};

export default welcomeTestCommand;
