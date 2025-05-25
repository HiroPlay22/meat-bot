fetch("meta/commits.json")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("commitLog");
    data.slice(0, 10).forEach(entry => {
      const row = document.createElement("div");
      row.className = "flex justify-between items-center border-b border-zinc-700 pb-1";
      row.innerHTML = `
        <span class="text-gray-400 text-xs w-[100px]">${entry.date}</span>
        <span class="text-blue-300 flex-1 ml-2 truncate">${entry.message}</span>
        <a href="${entry.url}" target="_blank" class="text-gray-500 hover:text-white text-xs border px-2 py-[2px] rounded ml-2">git</a>
      `;
      container.appendChild(row);
    });
  });