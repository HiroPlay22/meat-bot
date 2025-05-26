import {
  ButtonInteraction
} from 'discord.js';
import { setRollState, getRollState, clearRollState } from './rollState.js';
import { buildRollEmbed } from './buildRollEmbed.js';
import { buildRollButtons } from './buildRollButtons.js';
import { rollDice } from './rollUtils.js';
import { buildResultEmbed } from './buildResultEmbed.js';
import serverSettings from '../../../config/serverSettings.json' with { type: 'json' };

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
    setRollState(userId, { type: 'd20', count: 0 });
    return updatePhase(interaction, 'phase2');
  }

  // === COUNT SELECTION ===
  if (id.startsWith('roll_count_')) {
    const [, , type, countStr] = id.split('_');
    const count = parseInt(countStr);
    if (!state || state.type !== type) {
      return safeReply(interaction, '❌ Fehlerhafte Session.');
    }

    setRollState(userId, { ...state, count });
    return updatePhase(interaction, 'phase3');
  }

  // === BACK ===
  if (id === 'roll_back') {
    if (!state) return safeReply(interaction, '⚠️ Deine Würfel-Session ist abgelaufen.');
    const previousPhase = state.count > 0 ? 'phase2' : 'phase1';
    return updatePhase(interaction, previousPhase);
  }

  // === GM TOGGLE ===
  if (id === 'roll_gm_toggle') {
    if (!state) return safeReply(interaction, '⚠️ Deine Würfel-Session ist abgelaufen.');

    const newState = { ...state, gmEnabled: !state.gmEnabled };
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

    return safeUpdate(interaction, embed, buttons);
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
    } catch (e) {
      console.warn('⚠️ Modal konnte nicht angezeigt werden:', e);
    }
    return;
  }

  // === GO / WÜRFELN ===
  if (id === 'roll_go') {
    if (!state || !state.type || !state.count) {
      return safeReply(interaction, '❌ Roll unvollständig.');
    }

    const rolls = rollDice(state.type, state.count);
    const resultEmbed = buildResultEmbed({
      user: interaction.user,
      type: state.type,
      rolls,
      modifier: state.modifier || 0
    });

    clearRollState(userId);

    const guildId = interaction.guildId!;
    const gmChannelId = serverSettings.guilds[guildId]?.gamemasterChannelId;
    const targetChannel = state.gmEnabled
      ? interaction.guild?.channels.cache.get(gmChannelId)
      : interaction.channel;

    if (!targetChannel?.isTextBased()) {
      return safeReply(interaction, '❌ Fehler beim Zielkanal.');
    }

    try {
      await interaction.update({ components: [] });
    } catch (e: any) {
      if (e.code !== 10062) throw e;
      console.warn('⚠️ Interaktion war schon abgelaufen (roll_go)');
    }

    try {
      await targetChannel.send({ embeds: [resultEmbed] });
    } catch (e) {
      console.warn('⚠️ Fehler beim Senden des Ergebnisses:', e);
    }

    return;
  }

  return safeReply(interaction, '❌ Unbekannter Button.');
}

// === Embed & Buttons aktualisieren ===
async function updatePhase(interaction: ButtonInteraction, phase: 'phase1' | 'phase2' | 'phase3') {
  const state = getRollState(interaction.user.id);
  if (!state) return safeReply(interaction, '⚠️ Deine Session ist abgelaufen. Bitte /roll erneut ausführen.');

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

// === Hilfsfunktionen ===
async function safeReply(interaction: ButtonInteraction, content: string) {
  try {
    await interaction.reply({ content, ephemeral: true });
  } catch (err: any) {
    if (err.code === 10062) {
      console.warn('⚠️ Interaktion nicht mehr gültig (reply).');
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
      console.warn('⚠️ Interaktion nicht mehr gültig (update).');
    } else {
      throw err;
    }
  }
}
