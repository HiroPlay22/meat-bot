// server.ts
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Client } from 'discord.js';
import handleStatsRequest from './api/stats/index.js';

const app = express();

// 📍 ESM-kompatibles __dirname erzeugen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ API-Routen immer ZUERST definieren
app.get('/api/stats', (req, res) => {
  console.log("📡 [API] /api/stats wurde aufgerufen");
  const client = globalThis.discordClient as Client;
  return handleStatsRequest(req, res, client);
});

// ✅ Danach statische Inhalte freigeben
const publicPath = path.resolve(__dirname, 'web/pages');
app.use(express.static(publicPath));

// ✅ Fallback für nicht definierte Routen
app.use((req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden.' });
});

// ✅ Server starten
app.listen(3000, () => {
  console.log('🌐 Webserver läuft unter http://localhost:3000');
});
