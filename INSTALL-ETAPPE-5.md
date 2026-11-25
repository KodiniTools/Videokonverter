# Kodini Video-Konverter · Abschlussversion installieren

Das Komplettpaket enthält die Landingpage unter `/videokonverter/`, die
Werkzeugseite unter `/videokonverter/app/`, das 16:9-Titelbild und die
Quelltexte des Backends. Die bisherigen Werkzeugadressen bleiben nutzbar.

## Bestehende Installation aktualisieren

1. Sichere das bisherige Frontend. Entpacke das ZIP in ein separates
   Arbeitsverzeichnis auf dem VPS und wechsle nach `Videokonverter-main`.
2. Veröffentliche die bereits enthaltenen statischen Dateien:

   ```bash
   DEPLOY_SKIP_GIT=1 DEPLOY_WITH_BACKEND=0 bash ./deploy.sh
   ```

   Das Standardziel ist `/var/www/kodinitools.com/videokonverter`.
   Das Skript synchronisiert dieses Verzeichnis und erhält standardmässig
   `backend`. Für ein anderes Ziel oder weitere zu erhaltende Einträge
   gelten die Angaben zu `DEPLOY_TARGET` und `DEPLOY_KEEP` aus
   `INSTALL-ETAPPE-1.md`. Dort steht auch eine Variante zum direkten Kopieren
   der Dateien.

3. Falls `/app/` auf dem VPS noch nicht eingerichtet ist, verwende den
   NGINX-Abschnitt in `INSTALL-ETAPPE-1.md`. Bei funktionierender App-Route
   kann die bestehende Konfiguration weiterlaufen.
4. Öffne Landingpage und App auf dem VPS. Prüfe die Navigation, die
   Sprachwahl und den Theme-Wechsel in der globalen Navigation. Lade eine
   kleine Videodatei hoch, wähle ein Zielformat, starte die Konvertierung
   und öffne die heruntergeladene Datei.

Für dieses Frontend-Update brauchst du keinen Build und keinen
Backend-Neustart. Die Sprachfassungen und die App-Einstiegsdateien sind
bereits enthalten.

## Lokale Qualitätsprüfung

- 51 Frontend-Tests und 13 Backend-Tests bestanden.
- Der TypeScript-Build des Backends war erfolgreich.
- Chromium bei 375, 768 und 1440 px geprüft. Der Test deckte das Titelbild,
  beide Seiten, die interne Navigation, den Theme-Wechsel und die Breite
  der Seiten ab.
- Bei 375 px per Tastatur die Dateiauswahl geöffnet und eine MP4-Datei mit
  langem Namen hochgeladen. Die Datei wurde lokal durch das echte Backend
  mit FFmpeg zu WebM (VP9) konvertiert und im Browser heruntergeladen.
- Der lokale Test verwendete einen Testserver. Die aktive NGINX- und
  SSI-Konfiguration auf dem VPS ist separat zu prüfen.
