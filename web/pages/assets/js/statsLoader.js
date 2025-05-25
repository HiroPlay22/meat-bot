document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/stats")
    const stats = await res.json()

    // Version & DB-Größe
    document.querySelector('[data-stat="version"]').textContent = stats.version
    document.querySelector('[data-stat="db-size"]').textContent = stats.bot.dbSizeMB.toFixed(1) + " MB"

    // Commands
    document.querySelector('[data-stat="commands"]').textContent = stats.usage.totalCommands.toLocaleString("de-DE")
    document.querySelector('[data-stat="events"]').textContent = stats.usage.totalEvents

    // Ping
    document.querySelector('[data-stat="ping"]').textContent = stats.bot.avgPing + "ms"

    // CPU / RAM kannst du erweitern mit Balken
    document.querySelector('[data-stat="cpu-usage"]').textContent = stats.bot.system.cpu.usagePercent + "%"
    document.querySelector('[data-stat="ram-usage"]').textContent = stats.bot.system.memory.usedMB + " MB"

    // z. B. stats.bot.system.cpu.usagePercent etc.

    // Optional: Chart aktualisieren
    updateCommandChart(stats.usage.topCommands)
  } catch (err) {
    console.error("❌ Fehler beim Laden der Stats:", err)
  }
})

function updateCommandChart(commands) {
  const ctx = document.getElementById("commandChart").getContext("2d")
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: commands.map(cmd => cmd.command),
      datasets: [{
        label: "Verwendung",
        data: commands.map(cmd => cmd.count),
        backgroundColor: "#ff002f"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  })
}
