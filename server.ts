// server.ts
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import handleStatsRequest from './api/stats/index.js'

const app = express()

// __dirname manuell erzeugen (da ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// HTML-Ordner öffentlich verfügbar machen
const publicPath = path.resolve(__dirname, 'web/pages')
app.use(express.static(publicPath))

// 📡 API-Endpunkt aktivieren
app.get('/api/stats', handleStatsRequest)

// Server starten
app.listen(3000, () => {
  console.log('🌐 Express läuft unter http://localhost:3000')
})
