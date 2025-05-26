// modules/roll/handleRollButtons.ts

import {
  ButtonInteraction,
  InteractionReplyOptions
} from 'discord.js';
import { setRollState, getRollState, clearRollState } from './rollState.js';
import { buildRollEmbed } from './buildRollEmbed.js';
import { buildRollButtons } from './buildRollButtons.js';
import { rollDice } from './rollUtils.js';
import { buildResultEmbed } from './buildResultEmbed.js';

export async function handleRollButtons(interaction: ButtonInteraction) {
  const userId = interaction.user.id;
  const state = getRollState(userId);

  const id = interaction.customId;

  // === TYPE SELECTION ===
  if (id === 'roll_type_d6') {
    setRollState(userId, { type: 'd6', count: 0 });
    return updatePhase(interaction, 'phase2');
  }

  if (id === 'roll_type_dnd') {
    // Default to d20 – you can adjust to ask later
    setRollState(userId, { type: 'd20', count: 0 });
    return updatePhase(interaction, 'phase2');
  }

  // === COUNT SELECTION ===
  if (id.startsWith('roll_count_')) {
    const [, , type, countStr] = id.split('_');
    const count = parseInt(countStr);
    if (!state || state.type !== type) return interaction.reply({ content: '❌ Fehlerhafte Session.', ephemeral: true });

    setRollState(userId, { ...state, count });
    return updatePhase(interaction, 'phase3');
  }

  // === BACK ===
  if (id === 'roll_back') {
    if (!state) return interaction.reply({ content: '❌ Kein Würfel aktiv.', ephemeral: true });

    const previousPhase = state.count > 0 ? 'phase2' : 'phase1';
    return updatePhase(interaction, previousPhase);
  }

  // === GM TOGGLE ===
    if (id === 'roll_gm_toggle') {
    const state = getRollState(userId);
    if (!state) {
        return interaction.reply({
        content: '❌ Kein Wurf aktiv.',
        ephemeral: true
        });
    }

    // Toggle gmEnabled
    const newState = {
        ...state,
        gmEnabled: !state.gmEnabled
    };
    setRollState(userId, newState);

    const embed = buildRollEmbed({
        phase: 'phase3',
        user: interaction.user,
        type: newState.type,
        count: newState.count,
        modifier: newState.modifier,
        gmEnabled: newState.gmEnabled
    });

    const buttons = buildRollButtons({
        phase: 'phase3',
        viewer: interaction.user,
        owner: interaction.user,
        type: newState.type,
        gmEnabled: newState.gmEnabled,
        modifierSet: typeof newState.modifier === 'number'
    });

    await interaction.update({
        embeds: [embed],
        components: buttons
    });

    return;
    }


  // === MODIFIER ===
  if (id === 'roll_modifier') {
    await interaction.showModal({
      customId: 'roll_modifier_modal',
      title: 'DnD-Modifier einstellen',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              customId: 'modifier_input',
              label: 'Modifier (z. B. +3 oder -2)',
              style: 1,
              placeholder: '+2',
              required: true
            }
          ]
        }
      ]
    });
    return;
  }

  // === GO / WÜRFELN ===
  if (id === 'roll_go') {
    if (!state || !state.type || !state.count) return interaction.reply({ content: '❌ Roll unvollständig.', ephemeral: true });

    const rolls = rollDice(state.type, state.count);
    const resultEmbed = buildResultEmbed({
      user: interaction.user,
      type: state.type,
      rolls,
      modifier: state.modifier || 0
    });

    clearRollState(userId);

    const targetChannel = state.gmEnabled
      ? interaction.guild?.channels.cache.get(
          // @ts-ignore
          (await import('@/config/serverSettings.json')).default[interaction.guildId!]?.gamemasterChannelId
        )
      : interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return interaction.reply({ content: '❌ Fehler beim Zielkanal.', ephemeral: true });
    }

    await interaction.deferUpdate();
    await targetChannel.send({ embeds: [resultEmbed] });
    return;
  }

  // Unknown button
  return interaction.reply({ content: '❌ Unbekannter Button.', ephemeral: true });
}

// === Helper: Embed aktualisieren ===
async function updatePhase(interaction: ButtonInteraction, phase: 'phase1' | 'phase2' | 'phase3') {
  const state = getRollState(interaction.user.id);
  if (!state) return interaction.reply({ content: '❌ Session verloren.', ephemeral: true });

  const embed = buildRollEmbed({
    phase,
    user: interaction.user,
    type: state.type,
    count: state.count,
    modifier: state.modifier,
    gmEnabled: state.gmEnabled
  });

  const buttons = buildRollButtons({
    phase,
    viewer: interaction.user,
    owner: interaction.user,
    type: state.type,
    gmEnabled: state.gmEnabled,
    modifierSet: typeof state.modifier === 'number'
  });

  await interaction.update({ embeds: [embed], components: buttons });
}
