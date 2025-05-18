import { Client, GatewayIntentBits } from 'discord.js'
import 'dotenv/config'

console.log('🌐 Starte Discord-Bot…')

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('ready', () => {
  console.log(`✅ Eingeloggt als ${client.user?.tag}`)
  process.exit(0)
})

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🟢 login() erfolgreich ausgeführt'))
  .catch((err) => {
    console.error('❌ Login fehlgeschlagen:', err)
    process.exit(1)
  })
