# M.E.A.T. – Modular Enhanced Assistant Technology

Ein modularer Discord- & Twitch-Bot mit Eventsteuerung, Stats, Games und Persönlichkeit.  
Powered by Hiro – forever burned into the M.E.A.T.-core

## Features
📝 Feedback-System
- Modalgestütztes Einsenden von Nutzerfeedback
- Anzeige im Mod-Channel als Embed
- Sichtbarkeit nur für berechtigte Rollen (Mod-Channel-Category)

🗳️ Native Polls: Fungames-Voting
- Erstellung von Discord-Polls aus Gamelisten-DB
- Automatische Ausschlüsse (letzter Gewinner)
- Multivote aktiviert, max. 20 Spiele
- Buttons: Poll starten, Spiel hinzufügen/entfernen (Modal + SelectMenu)

🦖 ARK Dino Name Generator
- Namen aus lokaler Dino-Datenbank mit Eigenschaftenfilter (z. B. trashig, groß, pink)
- Modal zur Auswahl von Stil/Farbe/Größe/Typ
- Vorschläge in Moderations-Channel zur Freigabe/Ablehnung
- Embed-Ausgabe mit Stil-Footer und wechselnden Zitaten

## Features (plan)
- Modulbasiertes System: Jeder Funktionsbereich ist ein aktivierbares Modul
- Multiserver-fähig: getrennte Einstellungen, Texte und Rechte pro Discord-Server
- Dashboard-Verwaltung (Next.js): Texte, Events, Module und Rollen zentral steuerbar
- Rollenmatrix: Fein granulierte Rechtevergabe pro Modul
- DSGVO & Opt-in ready: Sentinel-Modul inkl. Audit-Logs, Zugriffskontrollen, Sessionschutz
- Globale & serverbasierte Modulsteuerung: auch durch Superadmin zentral schaltbar
- Übersetzbar (languages/): Mehrsprachigkeit pro Server einstellbar (nur Dashboard)
- Sichere API-Architektur: Zugriff validiert per Middleware & Serverkontext
- Event- und Voting-Module: mit Teilnehmerlisten, Wochenrückblick & Digest-Funktion
- Spielspezifische Features: z. B. für League, Monster Hunter, Valorant, Trivia
- Superadmin-Zentrale: globale Freigaben, Whitelists, Monitoring & Strukturkontrolle

## Lizenz
M.E.A.T. Custom License v1.0
Keine öffentliche Nutzung oder Weitergabe ohne schriftliche Genehmigung.
Exklusiv für autorisierte Systeme und Server vorgesehen.
