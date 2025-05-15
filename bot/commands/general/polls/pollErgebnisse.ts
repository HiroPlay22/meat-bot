import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } from 'discord.js';
  
  import { prisma } from '@database/client.js';
  
  export async function executePollErgebnisse(interaction: ChatInputCommandInteraction) {
    // 🧠 Suche das letzte beendete Montagsspiel-Voting
    const lastMontagPoll = await prisma.poll.findFirst({
      where: {
        endedAt: { not: null },
        winnerId: { not: null }
      },
      orderBy: { endedAt: 'desc' }
    });
  
    if (!lastMontagPoll) {
      await interaction.reply({
        content: '🧼 Keine Einsätze gefunden. Vielleicht war M.E.A.T. im Standby-Modus.',
        ephemeral: true
      });
      return;
    }
  
    const embed = new EmbedBuilder()
      .setTitle('📁 M.E.A.T.-Archivprotokoll')
      .setDescription('📡 Einsätze abgeschlossen. Zugriff auf letzte Voting-Auswertungen bereit.\n\nWähle einen Button für das letzte Protokoll:')
      .setColor(0x00AEFF);
  
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`view_poll_result_montag_${lastMontagPoll.id}`)
        .setLabel('🕹️ Montags-Runde')
        .setStyle(ButtonStyle.Secondary)
    );
  
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });
  
    console.log("📦 /poll ergebnis ausgelöst → Letztes Voting verfügbar gemacht.");
  }
  