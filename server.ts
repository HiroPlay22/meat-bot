// server.ts
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import handleStatsRequest from './api/stats/index.js'

// Express-App erstellen
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Öffentliche Seite freigeben
const publicPath = path.resolve(__dirname, 'web/pages')
app.use(express.static(publicPath))

// Nur weiterleiten – handleStatsRequest holt sich globalThis.discordClient selbst
app.get('/api/stats', handleStatsRequest)

const PORT = 3000
app.listen(PORT, () => {
  console.log(`🌐 Webserver läuft unter http://localhost:${PORT}`)
})
