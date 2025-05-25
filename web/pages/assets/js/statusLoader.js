
// Lädt den Bot-Status und triggert ein globales Event, sobald geladen
fetch("assets/json/bot-status.json")
  .then(res => res.json())
  .then(data => {
    window.BOT_STATUS = data.status === "online" ? "online" : "offline";

    // Event auslösen, damit alle DOMContentLoaded-Handler sauber darauf warten können
    document.dispatchEvent(new CustomEvent("botstatus:ready", {
      detail: { status: window.BOT_STATUS }
    }));
  })
  .catch(() => {
    window.BOT_STATUS = "offline";
    document.dispatchEvent(new CustomEvent("botstatus:ready", {
      detail: { status: "offline" }
    }));
  });
