import {
  ModalSubmitInteraction,
  EmbedBuilder,
  TextChannel,
  PermissionsBitField,
  MessageFlags
} from "discord.js";
import { createFeedback } from "@services/feedback/createFeedback.js";

export async function handleFeedbackModal(interaction: ModalSubmitInteraction) {
  console.log("✅ handleFeedbackModal() wurde aufgerufen");

  const title = interaction.fields.getTextInputValue("feedback_title");
  const description = interaction.fields.getTextInputValue("feedback_description");

  console.log("📥 Feedback-Daten empfangen:", { title, description });

  // Speichern in der Datenbank
  const feedback = await createFeedback({
    userId: interaction.user.id,
    username: interaction.user.tag,
    serverId: interaction.guildId || "DM",
    title,
    description,
    category: "Unkategorisiert", // Keine Kategorie mehr
    importance: "Mittel", // Standardwert, da keine Auswahl mehr für Wichtigkeit
  });

  const protocolNo = feedback.protocolNo.toString().padStart(4, "0");

  const userEmbed = new EmbedBuilder()
    .setTitle(`Feedback-Protokoll #${protocolNo}`)
    .setDescription(
      `Protokoll #${protocolNo} erfolgreich gesendet.\n` +
      `M.E.A.T. analysiert deine Eingabe mit... fragwürdiger Hingabe.`
    )
    .addFields(
      { name: "Titel", value: title },
      { name: "Feedback", value: description }
    )
    .setColor(0x00b5cc)
    .setFooter({ text: `Systemstatus: Eingabe empfangen • M.E.A.T. läuft` });

  await interaction.reply({
    embeds: [userEmbed],
    flags: MessageFlags.Ephemeral, // Nur für den User sichtbar
    allowedMentions: { repliedUser: false },
  });

  // 📢 Channel-Post mit Rollenanzeige
  const feedbackChannelId = "1364920956954607737"; // Dein Channel hier
  const logChannel = interaction.client.channels.cache.get(feedbackChannelId) as TextChannel;

  if (logChannel?.isTextBased()) {
    // Berechtigte Rollen ermitteln
    const guildRoles = interaction.guild?.roles.cache;
    const visibleRoles = guildRoles?.filter(role =>
      logChannel.permissionsFor(role)?.has(PermissionsBitField.Flags.ViewChannel)
    ) ?? new Map();

    // Berechtigte Rollen als Mentions
    const roleMentions = [...visibleRoles.values()]
      .filter(role => !role.managed && role.id !== interaction.guild?.id) // Keine Bot-Rollen oder @everyone
      .map(role => `<@&${role.id}>`)
      .join(" ");

    const publicEmbed = new EmbedBuilder()
      .setTitle(`Neues Feedback #${protocolNo}`)
      .addFields(
        { name: "Titel", value: title },
        { name: "Inhalt", value: description }
      )
      .setColor(0x00b5cc)
      .setFooter({ text: `Empfangen am ${new Date().toLocaleString("de-DE")}` });

    // Falls berechtigte Rollen existieren, wird deren Mention im Embed hinzugefügt
    if (roleMentions) {
      publicEmbed.addFields({ name: "Berechtigte Rollen", value: roleMentions });
    }

    await logChannel.send({ embeds: [publicEmbed] });
    console.log("✅ Embed wurde erfolgreich im Channel gepostet.");
  }
}
