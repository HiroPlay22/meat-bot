document.addEventListener("DOMContentLoaded", () => {
  fetch("assets/json/bot-status.json")
    .then(res => res.json())
    .then(data => {
      const isOnline = data.status === "online";

      // Avatar + Text
      const card = document.getElementById("statusCard");
      const wrapper = document.getElementById("avatarWrapper");
      const onlineStatus = document.getElementById("onlineStatus");
      const avatar = document.getElementById("avatarImage");

      if (isOnline) {
        card.classList.replace("bg-zinc-800", "bg-green-950");
        wrapper.classList.replace("border-zinc-700", "border-green-500");
        card.classList.add("pulse-green");
        onlineStatus.textContent = "[ONLINE]";
        onlineStatus.classList.remove("text-red-400");
        onlineStatus.classList.add("text-green-400");
      } else {
        card.classList.replace("bg-zinc-800", "bg-red-950");
        wrapper.classList.replace("border-zinc-700", "border-red-500");
        card.classList.remove("pulse-green");
        avatar.src = "assets/img/meat_bot_offline.webp";
        onlineStatus.textContent = "[OFFLINE]";
        onlineStatus.classList.remove("text-green-400");
        onlineStatus.classList.add("text-red-400");
      }

      onlineStatus.classList.remove("opacity-0");

      // Optional: auch .meat-activity oder Tippbox aktualisieren hier
    })
    .catch(() => {
      console.warn("⚠️ Status konnte nicht geladen werden.");
    });
});
