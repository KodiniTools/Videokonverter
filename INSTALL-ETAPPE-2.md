# Video-Konverter · Etappe 2 installieren

Dieses ZIP enthält das vollständige Projekt einschliesslich Etappe 1. Beide
Seiten verwenden denselben Werkzeugkopf. Auf dem VPS kommt die
Theme-Umschaltung aus der globalen KodiniTools-Navigation. Beim lokalen Test
ohne SSI übernimmt ein Schalter im Werkzeugkopf dieselbe Theme-Einstellung.

1. Sichere das bisherige Frontend. Entpacke das ZIP in ein separates
   Arbeitsverzeichnis und wechsle nach `Videokonverter-main`.
2. Aktualisiere das Frontend auf dem VPS mit:

   ```bash
   DEPLOY_SKIP_GIT=1 DEPLOY_WITH_BACKEND=0 bash ./deploy.sh
   ```

   Ein abweichendes Ziel oder zusätzliche zu erhaltende Verzeichnisse kannst
   du wie in `INSTALL-ETAPPE-1.md` beschrieben mit `DEPLOY_TARGET` und
   `DEPLOY_KEEP` angeben. Dort steht auch der NGINX-Abschnitt zur App-Route,
   falls du direkt von einem älteren Stand aktualisierst. Bei einer bereits
   funktionierenden Etappe-1-Installation ist keine NGINX-Änderung erforderlich.

3. Öffne `/videokonverter/` und `/videokonverter/app/`. Prüfe die Markierung
   der aktuellen Seite und den Wechsel in beide Richtungen. Wähle Englisch
   und wechsle erneut zwischen den Seiten. Schalte anschliessend über die
   globale Navigation zwischen Hell- und Dunkelmodus um. Prüfe den
   Kopfbereich auch auf einem schmalen Bildschirm.

Die deutschen und englischen HTML-Dateien sind im ZIP enthalten. Nach
späteren Änderungen an den HTML-Quelldateien erzeugt `npm run build:en`
die Sprachfassungen und App-Einstiegsdateien erneut.
