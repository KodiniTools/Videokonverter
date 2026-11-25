# Video-Konverter · Etappe 3 installieren

Das ZIP enthält das vollständige Projekt mit allen Dateien aus Etappe 1 und 2.
Die neuen Bedienfeldstile werden auf der Werkzeugseite geladen.

1. Sichere das vorhandene Frontend. Entpacke das ZIP in ein separates
   Arbeitsverzeichnis und wechsle nach `Videokonverter-main`.
2. Veröffentliche das Frontend auf dem VPS:

   ```bash
   DEPLOY_SKIP_GIT=1 DEPLOY_WITH_BACKEND=0 bash ./deploy.sh
   ```

   Ein abweichendes Ziel und zusätzliche zu erhaltende Verzeichnisse sind
   in `INSTALL-ETAPPE-1.md` beschrieben. Dort findest du auch die NGINX-Hinweise
   zur App-Route für eine Erstinstallation.
3. Öffne `/videokonverter/app/`. Prüfe den Upload per Klick und Drag & Drop
   sowie Formatwahl, Qualitätswahl, Konvertierung und Download. Wechsle
   zwischen Hell- und Dunkelmodus und prüfe die Buttons auch bei schmaler
   Fensterbreite und beim Durchtabben.

Die fertigen HTML-Dateien sind im ZIP enthalten. Es ist kein Frontend-Build
für die Installation nötig.
