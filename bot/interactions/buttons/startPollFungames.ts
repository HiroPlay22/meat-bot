
// bot/interactions/buttons/startPollFungames.ts
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
import { logSystem } from '@services/internal/log';

export default async function handleStartPollFungames(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true }); // WICHTIG: sofortiger Schutz
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

  // 2. Spiele laden & letzte 2 Gewinner ausschließen
  const allGames = await prisma.funGame.findMany();

  const lastWinners = await prisma.poll.findMany({
    where: { type: 'fungames', winnerId: { not: null } },
    orderBy: { endedAt: 'desc' },
    take: 2,
    select: { winnerId: true }
  });

  const excludedIds = lastWinners.map(w => w.winnerId).filter(Boolean);
  const filteredGames = allGames.filter(g => !excludedIds.includes(g.id));

  // 3. Zufällig mischen und 10 auswählen
  function shuffleArray<T>(array: T[]): T[] {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  const shuffledGames = shuffleArray(filteredGames);
  const selectedGames = shuffledGames.slice(0, 10);

  if (selectedGames.length < 2) {
    return interaction.editReply({
      content: '❌ Nicht genug Spiele für ein Voting vorhanden.',
    });
  }

  // 4. Poll-Titel vorbereiten
  const nextMonday = getNextMondayFormatted(); // z. B. "19-05"
  const pollNumber = await getPollNumber('fungames');
  const title = `MEAT/VOTE:MON-${nextMonday}/#${pollNumber}`;

  // 5. Poll senden
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
    fetchReply: true
  });

  // 6. Alte angepinnte Fungames-Nachricht entpinnen
  const pinnedMessages = await pollMsg.channel.messages.fetch({ limit: 50 });
  const oldPoll = pinnedMessages.find(
    m =>
      m.pinned &&
      m.author.id === interaction.client.user?.id &&
      m.id !== pollMsg.id &&
      m.embeds[0]?.title?.startsWith('MEAT/VOTE:MON-')
  );
  if (oldPoll) {
    await oldPoll.unpin().catch(() => {});
  }

  // 7. Neue Nachricht anpinnen
  if (!pollMsg.pinned) {
    await pollMsg.pin().catch(() => {});
  }

  // 8. Poll in DB speichern
  const poll = await prisma.poll.create({
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

  const url = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${pollMsg.id}`;
  await logSystem(`🗳️ Voting gestartet: Fungames (ID: ${poll.id})\n${url}`, interaction.client);

  // 9. VotingStats-Tracking
  await prisma.votingStats.create({
    data: {
      votingType: 'fungames',
      startedAt: new Date(),
      guildId: interaction.guildId ?? undefined
    }
  });

  // Kein weiteres reply/edit nötig – Poll steht ja öffentlich im Chat
}
