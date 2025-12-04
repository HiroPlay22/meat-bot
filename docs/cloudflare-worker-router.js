// Worker-Router für meatbot.de
// Ersetzt in den Hostnames unten die Railway-Endpoints.
// Deployment-Hinweis:
// - Account-ID und Zone-ID nicht ins Repo legen.
// - API-Token nur mit Worker/Route-Rechten nutzen.

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // API → Bot-Service
    if (url.pathname.startsWith('/api/')) {
      url.hostname = '<BOT_SERVICE_HOST>.up.railway.app'; // TODO: ersetzen
    } else {
      // Alles andere → Web-Service
      url.hostname = '<WEB_SERVICE_HOST>.up.railway.app'; // TODO: ersetzen
    }

    return fetch(new Request(url, request));
  },
};
