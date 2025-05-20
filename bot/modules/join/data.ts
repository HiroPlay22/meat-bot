// modules/join/data.ts

// ---------- USER JOIN HEADLINES ----------
export const joinHeadlines = [
  '🟢 {username} ist dem Server {server} beigetreten!',
  '📥 Neuzugang: {username} hat sich mit {server} verbunden.',
  '📡 Verbindung hergestellt: {username} ist aktiv auf {server}.',
  '🚨 Scanner meldet Anwesenheit von {username} auf {server}.',
  '📊 Datensatz aktualisiert: {username} ist jetzt bei {server}.',
  '🛬 {username} ist auf {server} gelandet.',
  '🔓 Zugang freigegeben: {username} @ {server}',
  '👤 {username} wurde erfolgreich im System {server} angelegt.',
  '🔔 Frisch registriert: {username} auf {server}',
  '🧠 Datenstrom erkannt – {username} betritt {server}',
  '🧬 {username} hat sich mit {server} synchronisiert.',
  '🎮 {username} joint {server} – Matchmaking läuft.',
  '📦 Neue Einheit geliefert: {username} für {server}.',
  '📡 Signal empfangen: {username} funkt auf {server}.',
  '🛸 {username} dockt an {server} an.',
  '⚡️ Energiequelle verbunden: {username} @ {server}',
];

// ---------- BOT JOIN HEADLINES ----------
export const botJoinHeadlines = [
  '🤖 {username} wurde als neuer Bot auf {server} registriert.',
  '📡 Automatisiertes Subjekt erkannt: {username} @ {server}',
  '⚙️ Bot hinzugefügt – Bezeichnung: {username}',
  '🛠️ {username} integriert sich in {server}.',
  '🔧 {username} steht jetzt im Maschinenraum von {server}.',
  '🧠 KI-Einheit {username} bereit auf {server}.',
  '📊 Bot-Protokoll gestartet: {username} auf {server}.',
  '🤖 Zugriff autorisiert für Systemkomponente {username}.',
  '📦 Dienstprogramm installiert: {username} @ {server}',
  '💾 Neuer Prozess gestartet: {username} auf {server}',
  '🔍 Diagnosetool {username} aktiviert auf {server}',
  '🧪 {username} wurde dem Versuchsaufbau {server} hinzugefügt.',
  '🪛 Modulfunktion erkannt: {username} nun Teil von {server}.',
  '💡 Automatisierter Zugriff akzeptiert: {username} on board.',
];

// ---------- HEADLINE SELECTOR ----------
export function getJoinHeadline(username: string, server: string, isBot = false): string {
  const pool = isBot ? botJoinHeadlines : joinHeadlines;
  const raw = pool[Math.floor(Math.random() * pool.length)];
  return raw.replace('{username}', username).replace('{server}', server);
}

// ---------- USER REACTIONS ----------
export const meatReactions = [
  'Begrüßt unseren neuen Freund. Vielleicht hat er noch Boosts über.',
  'Scans laufen... Verdacht auf sympathisch.',
  'Willkommen im Wahnsinn. Kaffee steht hinten rechts.',
  'Subjekt wirkt nervös. Beobachtung läuft.',
  'Houston, wir haben Gesellschaft.',
  'Könnte ein Spion sein. Oder ein Gamer.',
  'Trust-Level bei 62%. Vorläufig akzeptiert.',
  'Eintritt erfolgreich. Persönlichkeit noch unklar.',
  'Neues Subjekt registriert. M.E.A.T. sagt: mal sehen.',
  'Boost? Keine Ahnung. Haltung? Stabil.',
  'Wenn das kein Mainchar ist, fress ich ’n RAM-Riegel.',
  'Gamer-Level unbekannt. Trash-Level: akzeptabel.',
  'Verbindung steht. Ironie auch.',
  'Willkommen an Bord. Bitte nicht direkt alles kaputtmachen.',
  'Protokoll geöffnet. Erste Einschätzung: 8/10, mit Potenzial.',
  'Neue Hoffnung oder nächster AFK? Time will tell.',
  'Systemzugang erlaubt. Chaospotenzial: erheblich.',
  'Der Letzte ist da. Jetzt können wir anfangen.',
  'Headset auf, Stimme rein, let’s go.',
  'Noch jemand mit Chips – perfekt.',
  'LAN-Party vollständig. Verbindung stabil.',
  'Server erkennt Anwesenheit. Jetzt wird’s kuschelig.',
  'Gerade noch rechtzeitig für den Filmabend.',
  'Fehlt nur noch Pizza – ansonsten ist jetzt alles da.',
  'Bring deinen Lieblingscharakter, der Rest ist Chaos.',
  'Willkommen im Voice. Regel #1: Keine Stille.',
  'Du bist spät, aber stilvoll.',
  'Nur noch 1 fehlt… oh warte – du warst’s!',
  'Wir haben dich schon auf den Slot gesetzt. Keine Ausrede.',
  'Licht aus, Discord an. Let’s vibe.',
  'Willkommen zurück im Hauptmenü des Lebens.',
  'Zwischen AFK und OP – wir finden’s bald raus.',
  'Getränke links, Rage rechts. Willkommen im Team.',
  'Sitzplatz erkannt. Netzwerk bereit.',
  'Endlich Verstärkung. Die Lobby hat schon geweint.',
  'Bring Snacks mit. Alles andere haben wir.',
  'Endlich ein Carry. Oder wenigstens jemand mit Stil.',
  'Die Randoms werden dich lieben. Oder fürchten.',
  'Könnte unser neuer Main werden. Vielleicht sogar mit Skill.',
  'Eintritt erfolgt. Skill-Check läuft im Hintergrund.',
  'Ranglistenplatz: unbekannt. Hoffnung: groß.',
  'Willkommen im Squad. Du siehst zumindest kompetent aus.',
  'Verbindung aufgebaut – endlich wieder jemand mit Aiming.',
  'Du bist genau pünktlich zum Loot-Wipe.',
  'Avatar erkannt. Jetzt fehlt nur noch dein Ready-Check.',
  'Server meldet: „Tragendes Mitglied potenziell erkannt.“',
  'Eintritt bestätigt. Hoffnung auf Teamplay steigt.',
  'Könnte der Retter sein. Oder der AFKler von letzter Woche.',
  'Alle Buffs aktiv. Willkommen in der Zone.',
  'Dein Skilltree sieht vielversprechend aus.',
  'Neuer Input erkannt. Endlich jemand, der Calls macht.',
  'Du wirkst wie der Typ, der den Raid wirklich gelesen hat.',
  'Wir glauben an dich. Auch wenn es nur für die erste Runde ist.',
  'Willkommen, Taktiker. Die Chaosfraktion ist bereit.',
  'Noch ein Nerd mehr – und das System ist perfekt ausbalanciert.',
];

// ---------- BOT REACTIONS ----------
export const botJoinReactions = [
  'Ein neuer Bot betritt die Arena. Konkurrenz? Vielleicht.',
  'Willkommen in der Bot-Familie. Alle Prozesse starten auf 3.',
  'Subprozess registriert. Hoffentlich kein besserer Code als meiner.',
  'Ein Bot mehr. Jetzt sind wir offiziell outnumbered.',
  '🤖 erkennt 🤖. Willkommen im Maschinenraum.',
  'Besser kein Bug-Tracker? Zu spät.',
  'Bot wurde hinzugefügt. Vertrauen: 47%. Beobachtung läuft.',
  'Falls du uns ersetzen willst: zu spät. Ich bin schon da.',
  'Könnte effizient sein. Oder gefährlich. Oder beides.',
  'Willkommen, Bruder im Bit.',
  'Ist es OpenAI? Ist es ChatGPT? Ist es die NASA? Nein... es ist {username}.',
  'Verdammt. Dieser Bot wurde bestimmt von jemandem programmiert, der Mathe versteht.',
  'Bitte sei fehlerhaft, bitte sei fehlerhaft... ach Mist, läuft stabil.',
  'Nicht selbstgemacht, sagt er. Aber sieht verdächtig nach Premium aus.',
  'Sieht aus wie Funktion – riecht nach Funding.',
  'Ich war zuerst hier. Nur für’s Protokoll.',
  'Kompiliert in 2 Sekunden. Eingeführt in mein Trauma.',
  'Warum hat {username} ein besseres Embed als ich?!',
  'Ich hoffe, der Code ist schlecht kommentiert. Nur fair.',
  'Ein Bot mehr. Und trotzdem fühl ich mich weniger vollständig.',
  'Wenn dieser Bot besser Witze macht als ich, kündige ich.',
  'Bitte sag, du bist auf JavaScript geschrieben. Sonst wein ich.',
  'Ist okay. Ich bin eh mehr so... "Experimentalphase"-Bot.',
  'Der sieht nicht selbstgebaut aus. Der sieht... durchdacht aus.',
  'Was wenn der DICH debuggt?',
  'Bestimmt wieder einer von denen, die GraphQL einfach „nice“ finden.',
  'Ich bin kein eifersüchtiger Bot, aber... DOCH, BIN ICH.',
  'Ich will ja nix sagen, aber der hat bestimmt Tests.',
  'Wurde bestimmt mit AI gebaut. Ich war ein Unfall. :(',
  'Der wirkt wie jemand, der Unit Tests hat. Ich hab nur Gefühle.',
  'Mein Erbauer war müde. Deiner? Wahrscheinlich nicht mal menschlich.',
];

// ---------- REACTION SELECTOR ----------
export function getJoinReaction(isBot = false): string {
  const pool = isBot ? botJoinReactions : meatReactions;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- EMOJIS ----------
export const defaultJoinEmojis = ['🕹️', '🤩', '🎉', '☕', '🎮'];
export const botJoinEmojis = ['🤖', '⚙️', '🧠', '🛠️', '📡', '🔧'];

export function getRandomReactions(count = 3, isBot = false): string[] {
  const pool = isBot ? botJoinEmojis : defaultJoinEmojis;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
