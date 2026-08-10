#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Videokonverter – Einmaliges Server-Setup (Bootstrap)
# ------------------------------------------------------------
#  Bereitet einen frisch geklonten Server vor:
#    - prueft Voraussetzungen (node, npm, git, ffmpeg, pm2)
#    - legt Laufzeit-Ordner an (backend/uploads|outputs|logs)
#    - baut das Backend, startet es via PM2 (Port 9014)
#    - veroeffentlicht das Frontend im NGINX-Ordner
#  Danach laeuft die App; kuenftige Updates via ./deploy.sh.
#
#  Voraussetzung: Dieses Repo wurde bereits geklont, z. B.:
#      git clone https://github.com/KodiniTools/Videokonverter.git
#      cd Videokonverter
#      ./setup.sh
#
#  Das Repo-Verzeichnis darf beliebig liegen (kein /opt noetig);
#  dieses Skript nutzt sein eigenes Verzeichnis als Repo-Root.
#
#  Konfigurierbar per Umgebungsvariablen (siehe auch deploy.sh):
#      DEPLOY_TARGET   NGINX-Zielordner (Default: /var/www/kodinitools.com/videokonverter)
#      DEPLOY_BRANCH   Branch           (Default: main)
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*" >&2; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# --- 1. Voraussetzungen pruefen -----------------------------
log "Pruefe Voraussetzungen"
command -v git    >/dev/null 2>&1 || fail "git fehlt. Installiere z. B.: sudo apt install git"
command -v node   >/dev/null 2>&1 || fail "node fehlt. Installiere Node.js 20+ (z. B. via nvm)."
command -v npm    >/dev/null 2>&1 || fail "npm fehlt (kommt mit Node.js)."
command -v ffmpeg >/dev/null 2>&1 || fail "ffmpeg fehlt. Installiere: sudo apt install ffmpeg"

if ! command -v pm2 >/dev/null 2>&1; then
  warn "pm2 fehlt – installiere global (npm install -g pm2)"
  npm install -g pm2
fi

printf 'node:  %s\n' "$(node -v)"
printf 'npm:   %s\n' "$(npm -v)"
printf 'ffmpeg: %s\n' "$(ffmpeg -version | head -1)"

# --- 2. Laufzeit-Ordner sicherstellen -----------------------
log "Lege Laufzeit-Ordner an"
mkdir -p backend/uploads backend/outputs backend/logs

# --- 3. Deploy (Frontend + Backend) ausfuehren --------------
# deploy.sh uebernimmt: git-Sync, Frontend-Publish, Backend-Build,
# PM2-Start. Wir erzwingen den Backend-Teil beim Setup.
log "Starte vollstaendiges Deployment (Frontend + Backend)"
DEPLOY_WITH_BACKEND=1 bash "$SCRIPT_DIR/deploy.sh"

# --- 4. Abschlusshinweise -----------------------------------
log "✓ Setup abgeschlossen"
cat <<'NOTES'

Naechste Schritte / Hinweise:

  * Autostart nach Reboot (einmalig, als der PM2-Nutzer):
        pm2 startup            # Ausgabe-Befehl mit sudo ausfuehren
        pm2 save

  * NGINX: Static-Site-Location zeigt bereits auf
        /var/www/kodinitools.com/videokonverter
    Fuer die SSI-Includes (/partials/...) muss im server-Block
        ssi on;
    aktiv sein.

  * Kuenftige Updates (nach Merge in main):
        cd <dieses-Repo-Verzeichnis>
        ./deploy.sh                    # nur Frontend
        DEPLOY_WITH_BACKEND=1 ./deploy.sh   # Frontend + Backend

  * Status pruefen:
        pm2 status
        curl -s http://127.0.0.1:9014/health

NOTES
