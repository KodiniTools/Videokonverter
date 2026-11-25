# Video-Konverter · Etappe 1 installieren

Das ZIP enthält das vollständige Projekt. Die Landingpage liegt unter
`/videokonverter/`, das Werkzeug unter `/videokonverter/app/`. Die bisherigen
Werkzeugadressen liefern weiterhin dieselbe Oberfläche und verweisen über
Canonical auf die neue Adresse.

## Auf dem bestehenden VPS

1. Sichere vor dem Update das bisherige Frontend und die aktive NGINX-Konfiguration.
2. Entpacke das ZIP in ein separates Arbeitsverzeichnis auf dem VPS und wechsle
   nach `Videokonverter-main`.
3. Publiziere das Frontend mit dem vorhandenen Deploy-Skript. Verwende bei
   abweichendem Webverzeichnis zusätzlich `DEPLOY_TARGET`. Falls das bestehende
   Deployment weitere Einträge im Webverzeichnis erhält, übernimm dessen
   `DEPLOY_KEEP`-Wert. Das Skript synchronisiert das Ziel und entfernt dort
   ältere Frontend-Einträge.

   ```bash
   DEPLOY_SKIP_GIT=1 DEPLOY_WITH_BACKEND=0 bash ./deploy.sh
   ```

   Alternativ kopiere die statischen Dateien direkt:

   ```bash
   cp -a frontend/{index.html,index.en.html,converter.html,converter.en.html,robots.txt,app,css,js,fonts,images} \
     /var/www/kodinitools.com/videokonverter/
   ```

4. Teste `/videokonverter/app/`. Wenn die vorhandene NGINX-Konfiguration
   Unterverzeichnisse mit `index.html` bereits korrekt ausliefert, ist die
   deutsche App-Adresse direkt erreichbar. Für serverseitig ausgeliefertes
   englisches HTML bei `?lang=en` und eine explizite Weiterleitung der
   Adresse ohne Schrägstrich kann die folgende Ergänzung verwendet werden.

   Im `http`-Kontext:

   ```nginx
   map $arg_lang $video_converter_app_index {
       default index.html;
       en      index.en.html;
   }
   ```

   Im bestehenden HTTPS-`server`-Block:

   ```nginx
   location = /videokonverter/app {
       return 301 /videokonverter/app/$is_args$args;
   }

   location = /videokonverter/app/ {
       root /var/www/kodinitools.com;
       ssi on;
       try_files /videokonverter/app/$video_converter_app_index =404;
   }
   ```

   Passe den `root` an, falls dein tatsächliches Webverzeichnis abweicht.
   Die vorhandenen Regeln für API, WebSocket, die Landingpage und die globalen
   SSI-Partials bleiben für diesen Schritt bestehen. Prüfe bei Änderung der
   Konfiguration zuerst `sudo nginx -t` und lade NGINX anschliessend mit
   `sudo systemctl reload nginx` neu.

5. Öffne die Landingpage, prüfe das Titelbild, wechsle über „Konverter“ zur
   App und über „Startseite“ zurück. Prüfe beide Themes und beide Sprachen.
   Das Logo und der Theme- sowie Sprachschalter kommen vom vorhandenen
   SSI-Partial `/partials/nav.html`. Teste zum Schluss einen kleinen
   Upload mit Konvertierung und Download auf dem VPS.

Die HTML-Dateien sind im ZIP bereits fertig. Bei späteren Änderungen an
`frontend/index.html` oder `frontend/converter.html` aktualisiert
`npm run build:en` die Sprachfassungen und die beiden App-Einstiegsdateien.
