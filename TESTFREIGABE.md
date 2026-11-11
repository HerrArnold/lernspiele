# LernSafari 3.1 – sichere Testfreigabe

## Was wurde geprüft?
- Vollständigkeit von HTML-, JavaScript- und CSS-Dateien sowie 29 Originalspielen
- Vorhandensein der bekannten Cloudflare-HTTPS-Konfiguration
- Einbindung der Cloudflare-Anmeldung und erwarteter API-Endpunkte
- JavaScript-Syntax der Hauptdateien

## Was wurde nicht geprüft?
- Der echte GitHub-Pages-Deploy (kein verbundener Repository-Zugriff)
- Die Live-Anmeldung mit einem Test-Tierkonto (kein Testkonto)
- Der Adminzugang (kein Admincode)
- Cloudflare-Worker-Code, serverseitige Rechteprüfung und Datenbank

## Vorbereitung in GitHub
1. Repository für einen Test/Preview verbinden oder vorhandenes Repository duplizieren. **Nicht direkt die produktive Homepage überschreiben.**
2. Dateien aus dem Ordner `LernSafari-Prototyp-v3.1` in das Root des Test-Repositories hochladen. Die Ordnerstruktur beibehalten.
3. GitHub Pages für das Test-Repository aktivieren (Settings → Pages). Auf veröffentlichter Seite `/diagnose.html` aufrufen und «Diagnose starten» wählen.
4. Prüfen, dass die Cloudflare-Worker-CORS-Regeln die **Test-GitHub-Pages-Origin** freigeben. Keine Wildcard-Origin für authentifizierte/private APIs verwenden.
5. Zuerst ein **Test-Tierkonto** anmelden und abmelden, danach eine ausdrücklich dafür angelegte Testaufgabe zuweisen und abhaken.
6. Danach mit dem **Admin-Testzugang** die Verwaltung öffnen, Testaufgabe erstellen, bearbeiten und löschen. Prüfen, dass das Kind nur seine Aufträge sieht.
7. Ein zweites Testkonto benutzen, um zu prüfen, dass es die Daten des ersten nicht lesen oder bearbeiten kann.
8. In einem abgemeldeten Gastfenster geschützte API-Routen ohne Token aufrufen. Der Worker muss sie mit 401/403 ablehnen. Die Anzeige versteckter Knöpfe allein ist keine Sicherheit.

## Wichtige Grenzen
- `/diagnose.html` prüft bewusst keine vertraulichen Daten, Konten oder Passwörter.
- GitHub Pages ist öffentlich. Keine Schülerlisten, Passwörter oder API-Secrets in GitHub speichern.
- Die Originalspiele behalten ihre vorhandene Cloudflare-Datenanbindung. Die Migration von Spielversuchen auf neue Endpunkte ist nicht Bestandteil dieses Schritts.
- Eine statische Prüfung ersetzt keine serverseitigen Authentifizierungs-, Rollen- und Datenschutztests.
