// server.ts
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Client } from 'discord.js';
import handleStatsRequest from './api/stats/index.js';

const app = express();

// 🧭 Pfad-Hilfen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📡 API zuerst
app.get('/api/stats', (req, res) => {
  console.log("📡 [API] /api/stats aufgerufen");
  const client = globalThis.discordClient as Client;
  return handleStatsRequest(req, res, client);
});

// 🌍 Statische Dateien (z. B. CSS, JS, Bilder) – aus web/pages/assets
app.use('/assets', express.static(path.resolve(__dirname, 'web/pages/assets')));

// 🏠 HTML-Seite für alle anderen Routen
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'web/pages/index.html'));
});

// 🚀 Serverstart
app.listen(3000, () => {
  console.log('🌐 Webserver läuft unter http://localhost:3000');
});
