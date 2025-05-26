import { ButtonInteraction } from 'discord.js';
import {
  setRollState,
  getRollState,
  clearRollState,
  isRolling,
  startRolling,
  stopRolling
} from './rollState.js';
import { buildRollEmbed } from './buildRollEmbed.js';
import { buildRollButtons } from './buildRollButtons.js';
import { rollDice } from './rollUtils.js';
import { buildResultEmbed } from './buildResultEmbed.js';
import serverSettings from '../../../config/serverSettings.json' with { type: 'json' };

export async function handleRollButtons(interaction: ButtonInteraction) {
  const userId = interaction.user.id;
  const id = interaction.customId;
  const state = getRollState(userId);

  // === TYPE SELECTION ===
  if (id === 'roll_type_d6') {
    setRollState(userId, { type: 'd6', count: 0 });
    return updatePhase(interaction, 'phase2');
  }

  if (id === 'roll_type_dnd') {
    setRollState(userId, { count: 0 } as any); // Typ wird später gewählt
    return updatePhase(interaction, 'phase_dnd_select');
  }

  // === DnD WÜRFEL AUSWÄHLEN ===
  if (id.startsWith('roll_dndtype_')) {
    const newType = id.replace('roll_dndtype_', '') as any;
    const current = getRollState(userId);
    setRollState(userId, { ...current, type: newType });
    return updatePhase(interaction, 'phase2');
  }

  // === ANZAHL WÜRFEL ===
  if (id.startsWith('roll_count_')) {
    const [, , type, countStr] = id.split('_');
    const count = parseInt(countStr);
    if (!state || state.type !== type) return safeReply(interaction, '❌ Fehlerhafte Session.');
    setRollState(userId, { ...state, count });
    return updatePhase(interaction, 'phase3');
  }

  // === ZURÜCK ===
  if (id === 'roll_back') {
    if (!state) return safeReply(interaction, '⚠️ Keine Session gefunden.');

    // Woher kommen wir?
    if (!state.type) return updatePhase(interaction, 'phase1');
    if (!state.count) {
      if (state.type === 'd6') return updatePhase(interaction, 'phase1');
      else return updatePhase(interaction, 'phase_dnd_select');
    }

    return updatePhase(interaction, 'phase2');
  }

  // === GM TOGGLE ===
  if (id === 'roll_gm_toggle') {
    if (!state) return safeReply(interaction, '⚠️ Deine Würfel-Session ist abgelaufen.');
    const newState = { ...state, gmEnabled: !state.gmEnabled };
    setRollState(userId, newState);
    return updatePhase(interaction, 'phase3');
  }

  // === MODIFIER ===
  if (id === 'roll_modifier') {
    try {
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
    } catch (err) {
      console.warn('⚠️ Modal konnte nicht angezeigt werden:', err);
    }
    return;
  }

  // === 🎲 WÜRFELN ===
  if (id === 'roll_go') {
    if (!state || !state.type || !state.count) {
      return safeReply(interaction, '❌ Roll unvollständig.');
    }

    if (isRolling(userId)) {
      return safeReply(interaction, '⏳ Du würfelst gerade...');
    }

    startRolling(userId);

    try {
      await interaction.deferUpdate();

      const rolls = rollDice(state.type, state.count);
      const resultEmbed = buildResultEmbed({
        user: interaction.user,
        type: state.type,
        rolls,
        modifier: state.modifier || 0
      });

      const guildId = interaction.guildId!;
      const gmChannelId = serverSettings.guilds[guildId]?.gamemasterChannelId;
      const targetChannel = state.gmEnabled
        ? interaction.guild?.channels.cache.get(gmChannelId)
        : interaction.channel;

      if (!targetChannel?.isTextBased()) {
        return safeReply(interaction, '❌ Fehler beim Zielkanal.');
      }

      await targetChannel.send({ embeds: [resultEmbed] });
    } catch (err) {
      console.warn('⚠️ Fehler beim Würfeln:', err);
    } finally {
      stopRolling(userId);
    }

    return;
  }

  return safeReply(interaction, '❌ Unbekannter Button.');
}

// === PHASENWECHSEL ===
async function updatePhase(interaction: ButtonInteraction, phase: 'phase1' | 'phase2' | 'phase3' | 'phase_dnd_select') {
  const state = getRollState(interaction.user.id);
  if (!state) return safeReply(interaction, '⚠️ Session abgelaufen. Bitte /roll erneut ausführen.');

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

  return safeUpdate(interaction, embed, buttons);
}

// === HILFSMETHODEN ===
async function safeReply(interaction: ButtonInteraction, content: string) {
  try {
    await interaction.reply({ content, ephemeral: true });
  } catch (err: any) {
    if (err.code === 10062) {
      console.warn('⚠️ Interaktion (reply) abgelaufen.');
    } else {
      throw err;
    }
  }
}

async function safeUpdate(interaction: ButtonInteraction, embed: any, buttons: any) {
  try {
    await interaction.update({ embeds: [embed], components: buttons });
  } catch (err: any) {
    if (err.code === 10062) {
      console.warn('⚠️ Interaktion (update) abgelaufen.');
    } else {
      throw err;
    }
  }
}
