// bot/modules/roll/handleRollButtons.ts

import { ButtonInteraction } from 'discord.js';
import {
  setRollState,
  getRollState,
  isRolling,
  startRolling,
  stopRolling,
  getPreviousPhase,
  RollPhase
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

  //
  if (!state || state.ownerId !== userId) {
      return safeReply(interaction, '⚠️ Du darfst diese Würfel-Session nicht bedienen.');
    }
    if (!interaction.isRepliable()) {
    console.warn('⛔ Nicht antwortbare Interaktion blockiert.');
    return;
  }

  // === TYPE SELECTION ===
  if (id === 'roll_type_d6') {
    setRollState(userId, { type: 'd6', count: 0 });
    return updatePhase(interaction, 'phase2');
  }

  if (id === 'roll_type_dnd') {
    setRollState(userId, { type: undefined, count: 0 });
    return updatePhase(interaction, 'phase_dnd_count');
  }

  // === DND: ANZAHL vor TYP ===
  if (id.startsWith('roll_count_dnd_')) {
    const count = parseInt(id.replace('roll_count_dnd_', ''));
    const current = getRollState(userId);
    setRollState(userId, { ...current, count });
    return updatePhase(interaction, 'phase_dnd_select');
  }

  if (id.startsWith('roll_dndtype_')) {
    const newType = id.replace('roll_dndtype_', '') as any;
    const current = getRollState(userId);
    setRollState(userId, { ...current, type: newType });
    return updatePhase(interaction, 'phase3');
  }

  // === DND: NEU STARTEN (Zurück zu Anzahl) ===
  if (id === 'roll_dnd_reset_count') {
    // Nur den Würfeltyp zurücksetzen
    setRollState(userId, { type: undefined });
    return updatePhase(interaction, 'phase_dnd_count');
  }

  // === ANZAHL WÜRFEL (klassisch) ===
  if (id.startsWith('roll_count_')) {
    const [, , type, countStr] = id.split('_');
    const count = parseInt(countStr);
    if (!state || state.type !== type) return safeReply(interaction, '❌ Fehlerhafte Session.');
    setRollState(userId, { ...state, count });
    return updatePhase(interaction, 'phase3');
  }

  // === ZURÜCK ===
  if (id === 'roll_back') {
    const currentPhase = detectCurrentPhase(state);
    const prevPhase = getPreviousPhase(currentPhase, state);

    // 🧹 Zustand zurücksetzen für echten Rücksprung
    if (prevPhase === 'phase1') {
      setRollState(userId, { type: undefined, count: undefined, modifier: undefined, gmEnabled: undefined });
    } else if (prevPhase === 'phase2') {
      setRollState(userId, { count: undefined });
    } else if (prevPhase === 'phase_dnd_count') {
      setRollState(userId, { type: undefined });
    }

    return updatePhase(interaction, prevPhase);
  }

  // === GM TOGGLE ===
  if (id === 'roll_gm_toggle') {
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
    if (!state?.type || !state?.count) {
      return safeReply(interaction, '❌ Roll unvollständig.');
    }

    if (isRolling(userId)) {
      return safeReply(interaction, '⏳ Du würfelst gerade...');
    }

    startRolling(userId);

    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.deferUpdate();
      } catch (err: any) {
        if (err.code === 40060) {
          console.warn('⚠️ deferUpdate: Interaktion bereits acknowledged.');
          return;
        } else {
          throw err;
        }
      }
    }


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
async function updatePhase(interaction: ButtonInteraction, phase: RollPhase) {
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
    owner: { id: state.ownerId! },
    type: state.type,
    gmEnabled: state.gmEnabled,
    modifierSet: typeof state.modifier === 'number'
  });

  return safeUpdate(interaction, embed, buttons);
}

function detectCurrentPhase(state: ReturnType<typeof getRollState>): RollPhase {
  if (!state?.type && !state?.count) return 'phase1';
  if (!state?.type && state?.count) return 'phase_dnd_select';
  if (state?.type && !state?.count) {
    return state.type === 'd6' ? 'phase2' : 'phase_dnd_select';
  }
  return 'phase3';
}


// === HILFSMETHODEN ===
async function safeReply(interaction: ButtonInteraction, content: string) {
  try {
    await interaction.reply({ content, flags: 64 }); // 64 = ephemeral
  } catch (err: any) {
    if (
      err.code === 10062 ||
      err.code === 40060 ||
      err.message?.includes('Unknown interaction')
    ) {
      console.warn('⚠️ Interaktion (reply) abgelaufen oder bereits verarbeitet.');
    } else {
      throw err;
    }
  }
}

async function safeUpdate(interaction: ButtonInteraction, embed: any, buttons: any) {
  try {
    await interaction.update({ embeds: [embed], components: buttons });
  } catch (err: any) {
    if (
      err.code === 10062 ||
      err.code === 40060 ||
      err.message?.includes('Unknown interaction')
    ) {
      console.warn('⚠️ Interaktion (update) abgelaufen oder bereits verarbeitet. Kein Fallback möglich.');
    } else {
      throw err;
    }
  }
}
