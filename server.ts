// server.ts
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Client } from 'discord.js';
import handleStatsRequest from './api/stats/index.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ ⬅️ API zuerst
app.get('/api/stats', (req, res) => {
  const client = globalThis.discordClient as Client;
  return handleStatsRequest(req, res, client);
});

// ✅ Dann statische Seite
const publicPath = path.resolve(__dirname, 'web/pages');
app.use(express.static(publicPath));

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden.' });
});

app.listen(3000, () => {
  console.log('🌐 Webserver läuft unter http://localhost:3000');
});
