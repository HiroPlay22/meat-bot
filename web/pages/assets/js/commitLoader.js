document.addEventListener("DOMContentLoaded", async () => {
  const commitBox = document.getElementById("commitLog");

  if (!commitBox) return;

  try {
    const res = await fetch("https://api.github.com/repos/HiroPlay22/meat-bot/commits?per_page=5");
    const commits = await res.json();

    if (!Array.isArray(commits)) throw new Error("No commit data");

    commitBox.innerHTML = commits
      .map(
        (commit) => `
        <div class="border border-zinc-700 rounded p-3 bg-zinc-900">
          <div class="text-white font-semibold mb-1">${commit.commit.message.split("\n")[0]}</div>
          <div class="text-gray-400 text-xs">
            ${new Date(commit.commit.author.date).toLocaleString("de-DE")} – ${commit.commit.author.name}
          </div>
          <a href="${commit.html_url}" class="text-blue-400 text-xs underline hover:text-blue-200 mt-1 inline-block">Commit ansehen →</a>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("Fehler beim Laden der Commits:", err);
    commitBox.innerHTML = `<p class="text-red-400 text-sm">Fehler beim Laden der Updates. Check Konsole.</p>`;
  }
});
