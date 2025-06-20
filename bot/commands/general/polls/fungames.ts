import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Command } from '@types';
import { getNextMondayFormatted } from '@utils/date';
import { getPollNumber, getLastWinner } from '@modules/poll/utils';
import { prisma } from '@database/client.js';
import serverSettings from '@config/serverSettings.json' with { type: "json" };

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('fungames')
    .setDescription('Zeigt die aktuelle FunGames-Runde'),

  run: async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const nextMonday = getNextMondayFormatted();
    const settings = serverSettings.guilds[guildId];
    const modCategoryId = settings?.modCategoryId;

    await interaction.deferReply({ ephemeral: false }); // 🛡️ verhindert Unknown interaction

    // 🔐 Zugriff prüfen
    let hasAccess = false;
    if (modCategoryId) {
      const modCategory = interaction.guild?.channels.cache.get(modCategoryId);
      if (modCategory?.type === 4) {
        const perms = modCategory.permissionsFor(interaction.member!);
        hasAccess = perms?.has('ViewChannel') ?? false;
      }
    }

    // 🛑 Doppelte Polls verhindern
    const activePoll = await prisma.poll.findFirst({
      where: { type: 'fungames', endedAt: null }
    });

    if (activePoll) {
      const pollNumber = activePoll.pollNumber ?? '??';
      const pollUrl = `https://discord.com/channels/${guildId}/${interaction.channelId}/${activePoll.messageId}`;

      const embed = new EmbedBuilder()
        .setTitle(`📊 M.E.A.T.-Protokoll: VOTE/MON-${nextMonday}/#${pollNumber} läuft bereits`)
        .setDescription('> Protokollschacht ist belegt. Neues Voting abgelehnt.')
        .setColor(0xFF4F4F);

      const buttonLink = new ButtonBuilder()
        .setLabel('Zur Abstimmung')
        .setStyle(ButtonStyle.Link)
        .setURL(pollUrl);

      const buttonEnd = new ButtonBuilder()
        .setCustomId(`end_poll_fungames_${activePoll.id}`)
        .setLabel('Abstimmung beenden')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasAccess);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonLink, buttonEnd);

      return interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    }

    // 🆕 Neues Voting starten
    const pollNumber = await getPollNumber('fungames');
    const lastWinner = await getLastWinner('fungames');

    const embed = new EmbedBuilder()
      .setTitle(`🧠 M.E.A.T.-Protokoll: VOTE/MON-${nextMonday}/#${pollNumber}`)
      .setDescription([
        `Letzte Woche wurde **${lastWinner}** gezockt.`,
        `> Wird für diese Runde blockiert.`,
        ``,
        `\nZeit, das Kampfgebiet neu zu wählen.`,
      ].join('\n'))
      .setColor(0xF5A623);

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('start_poll_fungames')
        .setLabel('Poll starten')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('show_fungames_list')
        .setLabel('Spiele anzeigen')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('add_game_fungames')
        .setLabel('Spiel hinzufügen')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!hasAccess),
      new ButtonBuilder()
        .setCustomId('remove_game_fungames')
        .setLabel('Spiel entfernen')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasAccess)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
  }
};

export default {
  data: command.data,
  execute: command.run
};
