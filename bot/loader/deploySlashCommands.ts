import { registerSlashCommands } from "./commandLoader.js";
import { getDiscordToken } from "@config/secrets";

/**
 * Diese Datei deployed alle Slash-Commands an Discord.
 * Standard: nur für deinen Testserver (guild-basiert)
 * Setze `true`, um global zu registrieren (Achtung: Delay!)
 */

const token = getDiscordToken();
const USE_GLOBAL_DEPLOY = false;

registerSlashCommands(token, USE_GLOBAL_DEPLOY);
