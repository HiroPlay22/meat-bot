document.addEventListener("DOMContentLoaded", async () => {
  const commitBox = document.getElementById("commitLog");
  if (!commitBox) return;

  try {
    const res = await fetch("https://api.github.com/repos/HiroPlay22/meat-bot/commits?per_page=5");
    const commits = await res.json();

    commitBox.innerHTML = commits
      .map((commit) => {
        const date = new Date(commit.commit.author.date).toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return `
        <div class="flex items-center gap-3 text-sm text-gray-400">
          <span class="whitespace-nowrap text-xs text-zinc-500">${date}</span>
          <span class="text-blue-400 truncate max-w-[60%]">${commit.commit.message.split("\n")[0]}</span>
          <a href="${commit.html_url}" target="_blank" class="ml-auto text-xs px-2 py-[2px] border border-zinc-600 rounded hover:text-white hover:border-white transition">Commit</a>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("Fehler beim Laden der Commits:", err);
    commitBox.innerHTML = `<p class="text-red-400 text-sm">Fehler beim Laden der Updates. Check Konsole.</p>`;
  }
});
