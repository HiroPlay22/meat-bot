// bot/modules/roll/handleRollModal.ts

import { ModalSubmitInteraction } from 'discord.js';
import { getRollState, setRollState } from './rollState.js';
import { buildRollEmbed } from './buildRollEmbed.js';
import { buildRollButtons } from './buildRollButtons.js';

export async function handleRollModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== 'roll_modifier_modal') return;

  const userId = interaction.user.id;
  const state = getRollState(userId);

  if (!state || !state.type || !state.count) {
    try {
      await interaction.reply({ content: '❌ Keine aktive Session gefunden.', ephemeral: true });
    } catch (err: any) {
      if (err.code !== 10062) throw err;
      console.warn('⚠️ Modal-Interaktion bereits abgelaufen.');
    }
    return;
  }

  const input = interaction.fields.getTextInputValue('modifier_input').trim();
  const match = input.match(/^([+-])(\d{1,2})$/);

  if (!match) {
    try {
      await interaction.reply({
        content: '⚠️ Bitte gib einen gültigen Modifier ein (z. B. `+3` oder `-2`).',
        ephemeral: true
      });
    } catch (err: any) {
      if (err.code !== 10062) throw err;
      console.warn('⚠️ Modal-Fehlerantwort konnte nicht gesendet werden.');
    }
    return;
  }

  const sign = match[1];
  const value = parseInt(match[2]);
  const modifier = sign === '+' ? value : -value;

  const updatedState = { ...state, modifier };
  setRollState(userId, updatedState);

  const embed = buildRollEmbed({
    phase: 'phase3',
    user: interaction.user,
    type: updatedState.type,
    count: updatedState.count,
    modifier: updatedState.modifier,
    gmEnabled: updatedState.gmEnabled
  });

  const buttons = buildRollButtons({
    phase: 'phase3',
    viewer: interaction.user,
    owner: interaction.user,
    type: updatedState.type,
    gmEnabled: updatedState.gmEnabled,
    modifierSet: true
  });

  try {
    await interaction.update({ embeds: [embed], components: buttons });
  } catch (err: any) {
    if (err.code === 10062) {
      console.warn('⚠️ Modal-Interaktion war bereits abgeschlossen (update).');
    } else {
      throw err;
    }
  }
}
