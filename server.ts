// server.ts
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Client } from 'discord.js'
import handleStatsRequest from './api/stats/index.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ ZUERST die API-Route setzen!
app.get('/api/stats', (req, res) => {
  const client = globalThis.discordClient as Client
  console.log("📡 /api/stats aufgerufen")
  return handleStatsRequest(req, res, client)
})

// ✅ DANACH statische Dateien ausliefern
const publicPath = path.resolve(__dirname, 'web/pages')
app.use(express.static(publicPath))

// ✅ Und zuletzt ein generischer 404-Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden.' })
})

app.listen(3000, () => {
  console.log('🌐 Webserver läuft unter http://localhost:3000')
})
