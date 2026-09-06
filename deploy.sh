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
#      DEPLOY_BACKEND_DIR    Laufzeit-Ordner des Backends, aus dem PM2 startet
#                            (Default: <DEPLOY_TARGET>/backend). Liegt er nicht im
#                            Repo, wird der Build (dist + package*.json) dorthin
#                            synchronisiert – sonst laeuft PM2 mit altem Code weiter.
#      DEPLOY_KEEP           Im Zielordner zu erhaltende Eintraege
#                            (Leerzeichen-getrennt, Default: backend)
# ============================================================

# --- Konfiguration ------------------------------------------
BRANCH="${DEPLOY_BRANCH:-main}"
TARGET_DIR="${DEPLOY_TARGET:-/var/www/kodinitools.com/videokonverter}"
PM2_APP="${DEPLOY_PM2_APP:-videokonverter-server}"

# Eintraege, die beim Sync im Zielordner NICHT geloescht werden.
# WICHTIG: Auf dem Produktions-VPS liegt das laufende Backend im
# Web-Ordner (/var/www/kodinitools.com/videokonverter/backend) und
# PM2 startet von dort. Deshalb ist "backend" standardmaessig
# geschuetzt, damit ein Frontend-Deploy das Backend nicht loescht.
# Ueber DEPLOY_KEEP erweiterbar (ersetzt den Default).
read -r -a KEEP <<< "${DEPLOY_KEEP:-backend}"

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
  SCRIPT_HASH_BEFORE="$(sha256sum "${BASH_SOURCE[0]}" | cut -d' ' -f1)"
  git fetch --prune origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"

  # Bash liest ein Skript waehrend der Ausfuehrung weiter aus der ALTEN Datei.
  # Hat der Reset deploy.sh selbst veraendert, mit der neuen Version neu starten,
  # sonst laufen die restlichen Schritte noch mit der alten Logik.
  if [[ "$(sha256sum "${BASH_SOURCE[0]}" | cut -d' ' -f1)" != "$SCRIPT_HASH_BEFORE" ]]; then
    log "deploy.sh wurde aktualisiert – starte Deploy mit neuer Version neu"
    DEPLOY_SKIP_GIT=1 exec bash "${BASH_SOURCE[0]}" "$@"
  fi
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

  BACKEND_SRC="$SCRIPT_DIR/backend"
  BACKEND_RUNTIME="${DEPLOY_BACKEND_DIR:-$TARGET_DIR/backend}"

  log "Baue Backend (TypeScript)"
  pushd "$BACKEND_SRC" >/dev/null
  if [[ -f package-lock.json ]]; then
    npm ci --include=dev
  else
    npm install --include=dev
  fi
  npm run build
  [[ -f dist/server.js ]] || fail "Build fehlgeschlagen: backend/dist/server.js nicht gefunden."
  popd >/dev/null

  # PM2 startet auf dem Produktions-VPS aus $BACKEND_RUNTIME, nicht aus dem
  # Repo. Ohne diesen Sync wuerde "pm2 reload" nur den ALTEN Build neu starten
  # (z.B. ohne DELETE /api/jobs/:id -> 404 im Frontend).
  mkdir -p "$BACKEND_RUNTIME"
  if [[ "$(cd "$BACKEND_SRC" && pwd -P)" != "$(cd "$BACKEND_RUNTIME" && pwd -P)" ]]; then
    log "Synchronisiere Backend-Build nach $BACKEND_RUNTIME"
    rm -rf "$BACKEND_RUNTIME/dist"
    cp -a "$BACKEND_SRC/dist" "$BACKEND_RUNTIME/dist"
    for f in package.json package-lock.json ecosystem.config.js; do
      [[ -f "$BACKEND_SRC/$f" ]] && cp -a "$BACKEND_SRC/$f" "$BACKEND_RUNTIME/$f"
    done
    pushd "$BACKEND_RUNTIME" >/dev/null
    if [[ -f package-lock.json ]]; then
      npm ci --omit=dev
    else
      npm install --omit=dev
    fi
    popd >/dev/null
  fi

  pushd "$BACKEND_RUNTIME" >/dev/null
  mkdir -p logs uploads outputs
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
