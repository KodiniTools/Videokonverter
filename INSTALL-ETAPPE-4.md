# Video-Konverter · Etappe 4 installieren

Das ZIP enthält das vollständige Projekt einschliesslich der ersten drei Etappen.
Etappe 4 gestaltet den Arbeitsbereich, die Konvertierungswarteschlange sowie
die vorhandenen Status- und Fortschrittsanzeigen.

1. Sichere das bisherige Frontend. Entpacke das ZIP in ein separates
   Verzeichnis auf deinem VPS und wechsle nach `Videokonverter-main`.
2. Veröffentliche das fertige Frontend:

   ```bash
   DEPLOY_SKIP_GIT=1 DEPLOY_WITH_BACKEND=0 bash ./deploy.sh
   ```

   Hinweise zu abweichenden Zielverzeichnissen, zusätzlichen geschützten
   Verzeichnissen und zur Einrichtung von `/app/` stehen in
   `INSTALL-ETAPPE-1.md`.

3. Öffne `/videokonverter/app/` und lade eine kleine Videodatei hoch.
   Prüfe Dateinamen, Dateigrösse, Status, Fortschrittsanzeige und Download.
   Lade eine weitere Datei mit einem langen Dateinamen hoch und prüfe den
   Umbruch bei schmaler Fensterbreite. Wiederhole die Sichtkontrolle im
   Hell- und Dunkelmodus.

Die fertigen HTML-Dateien sind enthalten und können direkt ausgeliefert werden.
