document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/stats");
    const stats = await res.json();

    // Version & DB-Größe
    document.querySelector('[data-stat="version"]').textContent = stats.version;
    document.querySelector('[data-stat="db-size"]').textContent = stats.bot.dbSizeMB.toFixed(1) + " MB";

    // Commands
    document.querySelector('[data-stat="commands"]').textContent = stats.usage.totalCommands.toLocaleString("de-DE");
    document.querySelector('[data-stat="events"]').textContent = stats.usage.totalEvents;

    // Ping
    document.querySelector('[data-stat="ping"]').textContent = stats.bot.avgPing + "ms";

    // Falls du diese Felder im DOM verwendest:
    // document.querySelector('[data-stat="cpu-usage"]').textContent = stats.bot.system.cpu.usagePercent + "%";
    // document.querySelector('[data-stat="ram-usage"]').textContent = stats.bot.system.ram.usedMB + " MB";

    // Charts rendern
    updateCommandChart(stats.usage.topCommands);
    renderSystemCharts(stats);
  } catch (err) {
    console.error("❌ Fehler beim Laden der Stats:", err);
  }
});

function updateCommandChart(commands) {
  const ctx = document.getElementById("commandChart").getContext("2d");
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
  });
}

function renderSystemCharts(stats) {
  // CPU
  new Chart(document.getElementById("cpuChart"), {
    type: "bar",
    data: {
      labels: ["CPU"],
      datasets: [
        {
          label: "Auslastung (%)",
          data: [stats.bot.system.cpu.usagePercent],
          backgroundColor: "#ff002f",
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { stepSize: 25 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.raw}%` } },
      },
    },
  });

  // RAM
  new Chart(document.getElementById("ramChart"), {
    type: "bar",
    data: {
      labels: ["RAM"],
      datasets: [
        {
          label: "Verwendet (MB)",
          data: [stats.bot.system.ram.usedMB],
          backgroundColor: "#3b82f6",
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          min: 0,
          max: stats.bot.system.ram.totalMB,
          ticks: { stepSize: 512 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.raw} MB von ${stats.bot.system.ram.totalMB} MB`,
          },
        },
      },
    },
  });
}
