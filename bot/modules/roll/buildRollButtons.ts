// bot/modules/roll/buildRollButtons.ts

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
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase_dnd_count' | 'phase_dnd_select';
  viewer: User;
  owner: { id: string };
  type?: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  gmEnabled?: boolean;
  modifierSet?: boolean;
}) {
  const isOwner = viewer.id === owner.id;
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  // 🔒 Nicht-Besitzer = alles disabled
  if (!isOwner) {
    const lockRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_locked')
        .setLabel(`🔒 Hier würfelt ${owner.id}`)
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

    rows.push(lockRow, gmRow);
    return rows;
  }

  // === PHASE 1 ===
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

  // === NEUE DND-PHASE: ANZAHL AUSWÄHLEN ===
  if (phase === 'phase_dnd_count') {
    const countButtons: ButtonBuilder[] = [];
    for (let i = 1; i <= 10; i++) {
      countButtons.push(
        new ButtonBuilder()
          .setCustomId(`roll_count_dnd_${i}`)
          .setLabel(`${i} Würfel`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    for (let i = 0; i < countButtons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...countButtons.slice(i, i + 5)));
    }

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_back')
          .setLabel('Zurück')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  // === WÜRFELTYP WÄHLEN (DnD) ===
  if (phase === 'phase_dnd_select') {
    const dndButtons: ButtonBuilder[] = ['d4','d6','d8','d10','d12','d20'].map(type =>
      new ButtonBuilder()
        .setCustomId(`roll_dndtype_${type}`)
        .setLabel(type)
        .setStyle(ButtonStyle.Primary)
    );

    for (let i = 0; i < dndButtons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...dndButtons.slice(i, i + 5)));
    }

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_back')
          .setLabel('Zurück')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  // === KLASSISCHER WÜRFEL: ANZAHL WÄHLEN ===
  if (phase === 'phase2' && type) {
    const max = type === 'd6' ? 5 : 10;
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
          .setLabel('Zurück')
          .setStyle(ButtonStyle.Secondary)
      )
    );
  }

  // === PHASE 3: BEREIT ZU WÜRFELN ===
  if (phase === 'phase3' && type) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('roll_go')
        .setLabel('Würfeln')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('roll_back')
        .setLabel('Zurück')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('roll_gm_toggle')
        .setLabel(gmEnabled ? '🟢 GM-Channel deaktivieren' : '⚫ GM-Channel aktivieren')
        .setStyle(gmEnabled ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    rows.push(row);


    if (type !== 'd6') {
      const modifierRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('roll_modifier')
          .setLabel(modifierSet ? '⚙️ Modifier ändern' : '⚙️ Modifier einstellen')
          .setStyle(ButtonStyle.Secondary)
      );
      rows.push(modifierRow);
    }
  }

  return rows;
}
