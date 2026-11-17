# LernSafari – Unterrichtsmodus entfernt, Aktivität manuell (16.11.2026)

## Was sofort auf GitHub veröffentlicht wurde

- **Admin**: Bereich «Unterrichtsmodus» mit Ankunftszeit, Fachunterricht und Entdeckungszeit vollständig aus Hauptmenü, JavaScript und CSS entfernt. Die drei alten Dateien `unterrichtsmodus.js`, `unterrichtsmodus-admin.js` und `unterrichtsmodus.css` wurden gelöscht. Lernaufträge, Logbuch, Agenda und Lernfortschritt bleiben.
- **Kinder**: Unterrichtsmodus-Sperrprüfungen, 60-Sekunden-Fokus-Polling und iframe-Sperrlogik in der Haupt-LernSafari entfernt.
- **Ältere Spiele**: Legacy-Sperrfunktionen und Game-Access-Polling deaktiviert; die betroffenen Spielseiten laden bewusst eine neue Skriptversion.
- **Legacy-Lernsteuerung**: Alte Fokus-Regel-Bearbeitung und parallele Anwesenheitsmeldung entfernt, ebenso die periodischen Lernplan-Abfragen.
- **Lehrpersonen-Aktivität**: `GET /admin-live-activity` wird ausschliesslich durch Klick auf **«Jetzt abfragen: Wer ist wo?»** ausgeführt. Der bisherige 30-Sekunden-Aktualisierungstimer und der automatische Request beim Öffnen entfallen. Die Meldung zeigt nur Kinder mit aktuellen Aktivitätsmeldungen (bis zwei Minuten).
- **Nachrichten**: Die Verwaltungs-Nachrichtenliste wird erst beim Öffnen des Unterbereichs abgefragt.

## Einmalige Bereinigung des bisherigen Cloudflare-Zustands

Die heute aktive Worker-Version kennt noch die alten Einstellungen. Deshalb wurde eine **einmalige Bereinigung nach der nächsten erfolgreichen Flamingo-Anmeldung** vorbereitet:

1. Der Worker-Status `GET /admin-classroom-mode` wird abgefragt. Ist die bisherige Einstellung nicht `free`, wird via geschützter Admin-Schnittstelle `POST /admin-classroom-mode` die freie Einstellung gespeichert.
2. Anschliessend werden über `GET /admin-learning` vorhandene aktive oder zukünftige `class_focus_rules` geprüft. Diese werden mit dem vorhandenen, geschützten `DELETE /admin-focus-rules` deaktiviert. Bereits abgelaufene historische Regeln bleiben erhalten.
3. Scheitert die Bereinigung, zeigt die Verwaltung eine Warnung an; der Fehler wird nicht stillschweigend übergangen.

**Wichtig:** Diese Einmalaktionen benötigen ein wieder verfügbares D1-Kontingent und eine erfolgreiche Flamingo-Anmeldung. Bis dahin können im **Worker** noch alte Serverregeln vorhanden sein, obwohl die Webseite bereits keine Sperrfunktionen mehr anzeigt. Ein neues Worker-Deployment ist für das Abschalten der Oberfläche nicht erforderlich. Ein späterer Worker-Refactor sollte die veralteten API-Endpunkte und Tabellennutzung endgültig entfernen, darf aber die Lernaufträge und die Login-Sicherheit nicht beschädigen.

## Warum weiterhin kleine Anwesenheitsmeldungen nötig sind

Der Kinderbrowser meldet über `POST /activity-heartbeat` etwa alle 45 Sekunden seinen Bereich bzw. das gerade geöffnete Spiel. Dies sind **einzelne, eingeschränkte Schreibmeldungen**, nicht das Abrufen der gesamten Klassenübersicht. Ohne sie könnte die Lehrperson beim Knopfdruck nur alte oder überhaupt keine Daten sehen. Versteckte oder abgemeldete Geräte werden nicht als aktiv angezeigt.

Die Lehrperson ruft `/admin-live-activity` **nicht automatisch**, sondern ausschliesslich auf Knopfdruck ab. Die Anzeige entspricht «zuletzt innerhalb von zwei Minuten aktiv» und ist **kein Beweis einer heute noch gültigen Login-Sitzung**.

## Weitere Optimierungen, nach Nutzen priorisiert

1. **D1-Statistik verbessern:** Im Worker Lernfortschritts-Abfragen über einzelne Kinder/Fächer und Zeitfenster filtern, statt in `/admin-report` grosse Ausschnitte aus `game_attempts` und `activity_log` abzurufen.
2. **Lernhelfer-Datenbankabfrage umbauen:** Der Button ist jetzt manuell, aber `/learning-helpers` durchsucht beim Klick noch historische Einträge. Gezielt indexieren oder aggregierte Lernhelfer-Ergebnisse vorhalten. Erst `EXPLAIN QUERY PLAN` und D1-Rows-Read-Metriken prüfen.
3. **Getrennte kleine Admin-APIs:** Beim Öffnen der Verwaltung werden mit `/admin-learning` aktuell noch mehrere Datensätze (einschliesslich alter Anwesenheitsdaten) geladen. Künftig Aufträge, Aktivität und Fortschritte unabhängig und nur bei Bedarf laden.
4. **Datenbank-Indizes:** Bestehende Abfragen und Indizes für `game_attempts`, `class_assignments` und `sessions` anhand der tatsächlichen Query-Pläne prüfen, bevor neue Indizes eingeführt werden.
5. **Fehlermeldung bei erschöpfter D1-Quote:** Eine verständliche Wartungsmeldung mit Hinweis auf den nächsten UTC-Reset anzeigen, statt «Anmeldung fehlgeschlagen», wenn die Datenbank nicht erreichbar ist.
6. **Schreiblast bei Quizfragen reduzieren:** Lernversuche weiterhin zuverlässig für «FEHLERFREI» speichern; langfristig erste Versuche kompakt protokollieren und vollständige Sets am Schluss sicher auswerten, statt unnötig grosse Verläufe wiederholt auszulesen.

## Tests und Grenzen

JavaScript-Syntax der Hauptdateien, aller geänderten Steuerdateien und das Fehlen automatischer `/admin-live-activity`-Timer wurden geprüft. Die tatsächliche Aktivität und die D1-Einmalbereinigung können erst nach dem Quoten-Reset mit echten Logins auf Cloudflare vollständig getestet werden. **Kein produktiver Worker oder D1-Schema wurde in diesem GitHub-Schritt direkt verändert.**
