import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import handleStatsRequest from './api/stats/index.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ Zuerst API-Routen definieren
app.get('/api/stats', handleStatsRequest)

// ⬇️ Danach statische Dateien serven
const publicPath = path.resolve(__dirname, 'web/pages')
app.use(express.static(publicPath))

const PORT = 3000
app.listen(PORT, () => {
  console.log(`🌐 Webserver läuft unter http://localhost:${PORT}`)
})
