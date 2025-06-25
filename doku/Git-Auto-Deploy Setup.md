# Git-Auto-Deploy Setup (für meat-bot auf Ubuntu)

## Ziel
Automatischer Git Pull + PM2-Restart bei Push auf `main`.

---

## Projektstruktur

/opt/meat-bot              ← Hauptprojekt (Node.js Bot)  
/opt/Git-Auto-Deploy       ← Webhook-Tool von GitHub  
/opt/gitautodeploy-venv    ← Python venv für Git-Auto-Deploy  
/etc/git-auto-deploy/config.json  ← zentrale Config

---

## Installationen

### Systempakete:
apt install git python3 python3-venv curl

### PM2:
npm install -g pm2

### Python venv:
python3 -m venv /opt/gitautodeploy-venv  
source /opt/gitautodeploy-venv/bin/activate  
cd /opt/Git-Auto-Deploy  
pip install . --use-pep517

(Erforderliche Pakete wie `autobahn`, `twisted`, `lockfile` wurden mitinstalliert)

---

## Konfigurationsdatei

Pfad: `/etc/git-auto-deploy/config.json`

```json
{
  "allow-root-user": true,
  "repositories": [
    {
      "url": "https://github.com/HiroPlay22/meat-bot",
      "path": "/opt/meat-bot",
      "branch": "main",
      "deploy": "pm2 restart meat-bot"
    }
  ],
  "http-host": "0.0.0.0",
  "http-port": 9000
}
 