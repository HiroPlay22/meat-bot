import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PollLayoutType,
} from 'discord.js';
import { prisma } from '@database/client.js';
import { getNextMondayFormatted } from '@utils/date';
import { getPollNumber } from '@modules/poll/utils';

export default async function handleStartPollFungames(interaction: ButtonInteraction) {

  // 1. Check: Läuft bereits ein Voting?
  const active = await prisma.poll.findFirst({
    where: { type: 'fungames', endedAt: null },
  });

  if (active) {
    const url = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${active.messageId}`;
    const embed = new EmbedBuilder()
      .setTitle('📊 Nice try, du Schlingel.')
      .setDescription('> Protokollschacht ist belegt. Nur ein aktives Abstimmungsprotokoll pro Woche erlaubt.')
      .setColor(0xFF4F4F);

    const button = new ButtonBuilder()
      .setLabel('Zur Abstimmung')
      .setStyle(ButtonStyle.Link)
      .setURL(url);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    return interaction.editReply({ embeds: [embed], components: [row] });
  }

  // 2. Aktueller Poll-Stand vorbereiten
  const allGames = await prisma.funGame.findMany();
  const lastWinner = await prisma.poll.findFirst({
    where: { type: 'fungames', winnerId: { not: null } },
    orderBy: { endedAt: 'desc' },
  });

  function shuffleArray<T>(array: T[]): T[] {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  const excludedGameId = lastWinner?.winnerId;
  const filteredGames = allGames.filter(g => g.id !== excludedGameId);
  const shuffledGames = shuffleArray(filteredGames);
  const selectedGames = shuffledGames.slice(0, 10); // 🎲 zufällig ausgewählt


  if (selectedGames.length < 2) {
    return interaction.editReply({
    content: '❌ Nicht genug Spiele für ein Voting vorhanden.',
    });

  }

  // 3. Poll-Titel vorbereiten
  const nextMonday = getNextMondayFormatted(); // z. B. "19-05"
  const pollNumber = await getPollNumber('fungames');
  const title = `MEAT/VOTE:MON-${nextMonday}/#${pollNumber}`;

  // 4. Poll senden
  const pollMsg = await interaction.channel?.send({
    poll: {
      question: { text: 'Welches Spiel zocken wir Montag?' },
      answers: selectedGames.map(g => ({
        text: g.name,
        emoji: g.emoji ?? undefined,
      })),
      allowMultiselect: true,
      duration: 6 * 24, // 6 Tage
      layoutType: PollLayoutType.Default,
    },
  });

  // 5. Poll speichern
  await prisma.poll.create({
    data: {
      type: 'fungames',
      pollNumber,
      question: title,
      messageId: pollMsg.id,
      games: {
        connect: selectedGames.map(g => ({ id: g.id })),
      },
    },
  });

  // kein Reply nötig, Poll steht ja öffentlich im Chat
}
