#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Videokonverter – Deployment
# ------------------------------------------------------------
#  Veroeffentlicht das statische Frontend aus dem main-Branch
#  im NGINX-Ordner
#      /var/www/kodinitools.com/videokonverter
#  (NGINX-Alias fuer die Location /videokonverter/).
#
#  Optional wird zusaetzlich das TypeScript-Backend neu gebaut
#  und der PM2-Prozess (videokonverter-server, Port 9014) neu geladen.
#
#  Aufruf (auf dem Server, im Repo-Verzeichnis):
#      ./deploy.sh
#  oder ueber npm:
#      npm run deploy
#
#  Konfigurierbar per Umgebungsvariablen:
#      DEPLOY_BRANCH         Branch, der deployt wird        (Default: main)
#      DEPLOY_TARGET         Ziel-/NGINX-Ordner              (Default: /var/www/kodinitools.com/videokonverter)
#      DEPLOY_SKIP_GIT=1     git fetch/reset ueberspringen (lokalen Stand deployen)
#      DEPLOY_WITH_BACKEND=1 Zusaetzlich Backend bauen + PM2 neu laden
#      DEPLOY_PM2_APP        Name des PM2-Prozesses          (Default: videokonverter-server)
#      DEPLOY_KEEP           Zusaetzliche, im Zielordner zu
#                            erhaltende Eintraege (Leerzeichen-getrennt)
# ============================================================

# --- Konfiguration ------------------------------------------
BRANCH="${DEPLOY_BRANCH:-main}"
TARGET_DIR="${DEPLOY_TARGET:-/var/www/kodinitools.com/videokonverter}"
PM2_APP="${DEPLOY_PM2_APP:-videokonverter-server}"

# Eintraege, die beim Sync im Zielordner NICHT geloescht werden.
# Standardmaessig leer (der Zielordner enthaelt nur das statische
# Frontend); ueber DEPLOY_KEEP erweiterbar.
read -r -a KEEP <<< "${DEPLOY_KEEP:-}"

# Statische Frontend-Dateien, die veroeffentlicht werden:
PUBLISH=(index.html converter.html robots.txt sitemap.xml css js)

# Repo-Root = Verzeichnis dieses Skripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

log()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# --- 1. Aktuellen Stand von origin/<branch> holen -----------
if [[ "${DEPLOY_SKIP_GIT:-0}" != "1" ]]; then
  command -v git >/dev/null 2>&1 || fail "git ist nicht installiert."
  log "Hole aktuellen Stand von origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  log "DEPLOY_SKIP_GIT=1 – ueberspringe git, deploye aktuellen Arbeitsstand"
fi
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unbekannt')"
log "Deploye Commit $COMMIT (Branch $BRANCH)"

# --- 2. Frontend in NGINX-Zielordner veroeffentlichen -------
[[ -d "$FRONTEND_DIR" ]] || fail "Frontend-Ordner nicht gefunden: $FRONTEND_DIR"
[[ -f "$FRONTEND_DIR/index.html" ]] || fail "frontend/index.html nicht gefunden."

log "Veroeffentliche Frontend nach $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Alte Dateien entfernen, damit veraltete Assets nicht liegenbleiben.
# KEEP-Eintraege bleiben erhalten.
shopt -s nullglob dotglob
for entry in "$TARGET_DIR"/*; do
  name="$(basename "$entry")"
  keep=0
  for k in "${KEEP[@]}"; do [[ "$name" == "$k" ]] && keep=1 && break; done
  [[ $keep -eq 1 ]] && continue
  rm -rf "$entry"
done
shopt -u nullglob dotglob

# Frische statische Dateien hineinkopieren.
for item in "${PUBLISH[@]}"; do
  src="$FRONTEND_DIR/$item"
  if [[ -e "$src" ]]; then
    cp -a "$src" "$TARGET_DIR"/
  else
    log "Hinweis: '$item' nicht vorhanden – uebersprungen"
  fi
done
log "Frontend veroeffentlicht ($(printf '%s ' "${PUBLISH[@]}"))"

# --- 3. Backend (optional) bauen + PM2 neu laden ------------
if [[ "${DEPLOY_WITH_BACKEND:-0}" == "1" ]]; then
  command -v node >/dev/null 2>&1 || fail "node ist nicht installiert."
  command -v npm  >/dev/null 2>&1 || fail "npm ist nicht installiert."

  log "Baue Backend (TypeScript)"
  pushd "$SCRIPT_DIR/backend" >/dev/null
  mkdir -p logs uploads outputs
  if [[ -f package-lock.json ]]; then
    npm ci --include=dev
  else
    npm install --include=dev
  fi
  npm run build
  [[ -f dist/server.js ]] || fail "Build fehlgeschlagen: backend/dist/server.js nicht gefunden."

  if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
      log "Lade PM2-Backend neu: $PM2_APP (Port 9014)"
      pm2 reload "$PM2_APP" --update-env
    else
      log "Starte PM2-Backend erstmalig: $PM2_APP (Port 9014)"
      pm2 start ecosystem.config.js
    fi
    pm2 save >/dev/null 2>&1 || true
  else
    log "pm2 nicht gefunden – Backend nicht (neu) gestartet."
    log "Installiere PM2 mit: npm install -g pm2"
  fi
  popd >/dev/null
else
  log "Backend uebersprungen (DEPLOY_WITH_BACKEND=1 setzen, um es mitzudeployen)"
fi

log "✓ Deployment abgeschlossen (Commit $COMMIT → $TARGET_DIR)"
