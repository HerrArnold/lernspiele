# LernSafari 3.0 – GitHub Pages und Cloudflare

## Status
Die Frontend-Verbindung nutzt vorhandene Endpunkte aus der bisherigen LernSafari. Die originale Worker-Implementierung und D1-Datenbank gehören **nicht** zu diesem Paket und wurden nicht verändert. Die Schnittstellen können deshalb erst auf deiner veröffentlichten GitHub-Pages-Seite mit gültigen Testkonten durchgängig geprüft werden.

## Bereits angeschlossene Schnittstellen
- Kinderlogin: `POST /login`, Identität: `GET /me`, Logout: `POST /logout`
- Persönlicher Lernplan: `GET /learning-plan`, Auftrag abhaken: `POST /assignment-done`
- Spiel-Erfolge: `GET /highscores` (die Originalspiele speichern selbst über ihre bestehenden APIs)
- Lehrpersonenzugang: `POST /admin-unlock`, Prüfung: `GET /admin-session`
- Adminaufträge: `GET /admin-learning`, `POST /admin-assignments`, `DELETE /admin-assignments`
- Wochenagenda: `GET /agenda`, Admin: `GET /admin-agenda`
- Vollständige bestehende Adminoberfläche: als interne Seite `original/index.html#admin`

## Publikation bei GitHub Pages
1. Eine **Kopie/Backup** des bestehenden Repositorys behalten.
2. Die Dateien **aus dem Ordner** `LernSafari-Prototyp-v3.0` in das veröffentlichte Stammverzeichnis des GitHub-Repositories übernehmen; nicht den umschliessenden Versionsordner hochladen.
3. Darauf achten, dass `index.html`, `cloudflare-integration.js`, `original/index.html`, `original/assets/login-config.js`, `original/spiele/` und `assets/` erhalten bleiben.
4. In GitHub unter **Settings → Pages → Build and deployment** die bereits verwendete Branch-/Root-Konfiguration belassen.
5. Live-Webseite laden, mit einem **Test-Tierkonto** anmelden, Logbuch ansehen und eine Test-Aufgabe abhaken; anschliessend das Konto abmelden.
6. **Lehrperson anmelden** mit dem bisherigen Cloudflare-Admincode, Test-Aufgabe erstellen, mit Test-Tierkonto prüfen und wieder löschen.
7. Prüfen, ob die alte Cloudflare-Domain in `original/assets/login-config.js` noch stimmt. Wenn der Worker anders heisst, **nur diese öffentliche URL** anpassen. Niemals Passwörter, Admincodes oder Cloudflare-API-Tokens in Dateien eintragen.

## Cloudflare-CORS und Zugriffskontrolle
- Der bestehende Worker muss die GitHub-Pages-Origin und bei einer zusätzlichen Schul-/Custom-Domain auch diese Origin unterstützen.
- Beim OPTIONS-Preflight die Header `Content-Type`, `Authorization`, `X-Safari-Admin` sowie die Methoden `GET`, `POST`, `DELETE` berücksichtigen. Die Antwort muss zur anfragenden erlaubten Origin passen.
- Schüleridentität und Adminrechte immer **serverseitig** aus Token und Rollen prüfen. Die Sichtbarkeit von Knöpfen oder eine CSS-Sperre ist kein Schutz.
- Die Originalspiele unter `original/` sind auf GitHub Pages statisch erreichbar. **Keine personenbezogenen Daten oder geheime Lösungen** als Dateien ins GitHub-Repository legen.
- Der bisherige Worker-Code wurde nicht mitgeliefert oder geändert. Bestehende Rate-Limits, Passwort-Hashing, Token-Laufzeiten, CORS und D1-Zugriff vor echtem Einsatz im Worker überprüfen.

## Bekannte Grenzen
- Die neue Startseite und das Logbuch verwenden die vorhandene Cloudflare-API; ein live verifizierter End-to-End-Test ist hier ohne Zugangsdaten und Browser nicht erfolgt.
- Die Demo-Schaltflächen sind weiterhin getrennt verfügbar und verwenden nur lokale Daten. Sie sind **keine** echte Anmeldung.
- Eine GitHub-Pages-Veröffentlichung lädt statische HTML/JS-Dateien öffentlich aus. Privates liegt ausschliesslich im authentifizierten Cloudflare-Backend.
- Die neue Wochenagenda ist vorerst eine einfache Ansicht der bestehenden Daten; die ausführliche Bearbeitung läuft weiterhin in der bisherigen Cloudflare-Verwaltung.
