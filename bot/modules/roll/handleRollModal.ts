// modules/roll/handleRollModal.ts

import { ModalSubmitInteraction } from 'discord.js';
import { getRollState, setRollState } from './rollState.js';
import { buildRollEmbed } from './buildRollEmbed.js';
import { buildRollButtons } from './buildRollButtons.js';

export async function handleRollModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId !== 'roll_modifier_modal') return;

  const userId = interaction.user.id;
  const state = getRollState(userId);
  if (!state || !state.type || !state.count) {
    return interaction.reply({ content: '❌ Keine aktive Session gefunden.', ephemeral: true });
  }

  const input = interaction.fields.getTextInputValue('modifier_input').trim();

  const match = input.match(/^([+-])(\d{1,2})$/);
  if (!match) {
    return interaction.reply({
      content: '⚠️ Bitte gib einen gültigen Modifier ein (z. B. `+3` oder `-2`).',
      ephemeral: true
    });
  }

  const sign = match[1];
  const value = parseInt(match[2]);
  const modifier = sign === '+' ? value : -value;

  setRollState(userId, { ...state, modifier });

  const embed = buildRollEmbed({
    phase: 'phase3',
    user: interaction.user,
    type: state.type,
    count: state.count,
    modifier,
    gmEnabled: state.gmEnabled
  });

  const buttons = buildRollButtons({
    phase: 'phase3',
    viewer: interaction.user,
    owner: interaction.user,
    type: state.type,
    gmEnabled: state.gmEnabled,
    modifierSet: true
  });

  await interaction.update({ embeds: [embed], components: buttons });
}
