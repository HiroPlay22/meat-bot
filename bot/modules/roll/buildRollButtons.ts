import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User
} from 'discord.js';

export function buildRollButtons({
  phase,
  viewer,
  owner,
  type,
  gmEnabled,
  modifierSet
}: {
  phase: 'phase1' | 'phase2' | 'phase3';
  viewer: User;
  owner: User;
  type?: 'd6' | 'd4' | 'd8' | 'd10' | 'd12' | 'd20';
  gmEnabled?: boolean;
  modifierSet?: boolean;
}) {
  const isOwner = viewer.id === owner.id;
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  if (!isOwner) {
    const infoRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_locked')
        .setLabel(`🔒 Hier würfelt ${owner.username}`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary)
    );

    const gmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_gm_status')
        .setLabel(gmEnabled ? '🟢 GM-Channel aktiviert' : '⚫ GM-Channel deaktiviert')
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary)
    );

    rows.push(infoRow, gmRow);
    return rows;
  }

  // === Eigentümeransicht ===
  if (phase === 'phase1') {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_type_d6')
          .setLabel('🎲 Würfel')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('roll_type_dnd')
          .setLabel('🧙 DnD-Würfel')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('roll_type_aram')
          .setLabel('🧊 ARAM')
          .setDisabled(true)
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  if (phase === 'phase2' && type) {
    const isDnd = type !== 'd6';
    const max = isDnd ? 10 : 5;
    const buttonChunks: ButtonBuilder[][] = [];

    for (let i = 1; i <= max; i++) {
      const btn = new ButtonBuilder()
        .setCustomId(`roll_count_${type}_${i}`)
        .setLabel(`${i} Würfel`)
        .setStyle(ButtonStyle.Primary);

      const chunkIndex = Math.floor((i - 1) / 5);
      if (!buttonChunks[chunkIndex]) buttonChunks[chunkIndex] = [];
      buttonChunks[chunkIndex].push(btn);
    }

    for (const chunk of buttonChunks) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...chunk));
    }

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_back')
          .setLabel('🔙 Zurück')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  if (phase === 'phase3' && type) {
    const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_go')
        .setLabel('🎲 Würfeln')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('roll_back')
        .setLabel('🔙 Zurück')
        .setStyle(ButtonStyle.Secondary)
    );

    const gmToggleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_gm_toggle')
        .setLabel(gmEnabled ? '🟢 GM-Channel deaktivieren' : '⚫ GM-Channel aktivieren')
        .setStyle(gmEnabled ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    rows.push(mainRow, gmToggleRow);

    if (type !== 'd6') {
      const modifierRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_modifier')
          .setLabel(modifierSet ? '🧪 Modifier ändern' : '⚙️ Modifier einstellen')
          .setStyle(ButtonStyle.Secondary)
      );
      rows.push(modifierRow);
    }
  }

  return rows;
}
