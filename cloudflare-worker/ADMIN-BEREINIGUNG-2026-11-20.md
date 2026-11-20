# Flamingo-Verwaltung: sechs Bereiche und Übernahme der Punktestatistik

Stand: 20.11.2026

## Sichtbare Hauptnavigation

1. **Matheplan:** Kinder-Häkchen pro Aufgabe, Klassenmatrix, Einzelansichten.
2. **Lernaktivität nach Inhalt:** Lern-Lagune (Fachfilter), Oase, Baobab (Klasse / Tier).
3. **Lernaufträge:** Aufträge planen und kontrollieren, Exit-Tickets inklusive Antworten, lokale Vorschau für Aufgaben des Tages, manuelles Laden von Nachrichten und Entsperren von Tierkonten.
4. **Aktivitätsübersicht:** ausschliesslich der manuelle Knopf «Jetzt abfragen: Wer ist wo?».
5. **Agenda:** Hausaufgaben und Termine bearbeiten.
6. **Erinnerungen:** Polaroids und weitere Fotos verwalten. Daten nur beim Öffnen laden.

Die frühere separate **Lernfortschritte nach Punkten**-Seite, die alte Cloudflare-Verwaltung als Iframe und lokale Besucherstatistiken sind keine weiteren Hauptmenüpunkte. Alte Skripte bleiben aus Kompatibilitätsgründen allenfalls im Repository, werden aber nicht mehr von der Startseite geladen.

## Bestehende Punktedaten in der neuen Matrix

- Ehemalige **Highscores** aus D1 werden als Rohpunkte bei der passenden Tier-Spiel-Kombination angezeigt. Ein reiner Highscore ist **kein Prozentwert**.
- Aus historisch gespeicherten **Spielabschlüssen** zeigt die Matrix Durchlaufanzahl, ersten gespeicherten und besten Prozentwert.
- **Einzelversuche, Antworten und Fehlertexte** aus der früheren Lernfortschrittsansicht können in der Einzelansicht durch den Knopf «Einzelversuche ansehen» für genau ein Tier und ein Spiel nachgeladen werden; maximal 100 Datensätze.
- Bei älteren Spielen ohne Abschlussereignis kann eine erste Runde nicht zuverlässig rekonstruiert werden. Für diese erscheinen vorhandene Einzelprüfungen / Punkte, aber keine künstlichen Prozentwerte.
- Historisch nicht mehr im Lernkatalog aufgeführte Spiele bleiben als «Weitere gespeicherte Spiele» sichtbar.
- Ein Besuch wird getrennt von einer bewerteten Leistung ausgewiesen.

## Ressourcensparen

- `GET /admin-learning` fragt nur noch Tierkonten, Aufträge, Erledigt-Häkchen und Bestätigungen ab. Alte `class_presence`- und `class_focus_rules`-Vollabfragen entfallen **nach dem Worker-Deploy**.
- `GET /admin-learning-matrix` berechnet ganze Durchläufe mit SQL `ROW_NUMBER()` und `GROUP BY` und liefert pro Kind und Spiel nur **eine Summenzeile** (statt bis zu 12'000 einzelne Abschlussreihen). Vollständige Historie wird nicht an alle Tabellenzellen übertragen.
- `GET /admin-learning-history` liefert sensible Einzelantworten nur bei explizitem Lehrpersonen-Klick; 100 Datensätze Limit.
- Exit-Ticket-Daten werden nur beim ersten Öffnen von «Lernaufträge» geladen (danach über «Tickets laden»).
- Fotos werden erst beim Öffnen von «Erinnerungen» geladen.
- Der Herzschlag für «Wer ist wo?» erfolgt bei unverändertem Bereich höchstens alle **90 Sekunden** statt alle 45 Sekunden; der erste Login sendet einen Startstatus. Die Abfrage der Gesamtübersicht bleibt manuell.
- Die GitHub-basierte Tagesaufgaben-Vorschau liest keine Cloudflare-Datenbank.
- Keine neue Cron-/Timer-Abfrage der Klasse und keine zusätzliche Abfrage zum Aktualisieren von Prozentwerten.

## Kombiniertes Cloudflare-Update

Im Chat liegt die ZIP `lernsafari-worker-matheplan-lernaktivitaet-admin-bereinigt-2026-11-20.zip` mit dem kompletten `worker.js`.

**Nicht automatisch deployed.** Der aktive Cloudflare-Code muss vor dem Einfügen gesichert und mit der ZIP verglichen werden. Änderungen, die später direkt am Worker vorgenommen wurden, dürfen nicht blind überschrieben werden.

Das Paket ersetzt die älteren Worker-ZIPs und vereint Matheplan, Lernaktivität, Geschichte/Einzelversuche, alte Highscores, Fotos und Briefe. Vorhandene Schüler- und Punktdaten werden nicht gelöscht. Die Tabellen für Häkchen und Aufrufe werden bei Bedarf idempotent erzeugt.

## Prüfungen

- JavaScript-Syntax aller relevanten Dateien.
- Testbeispiele zu erstem und bestem Durchlauf, Highscore und historischen Tierquizzen.
- SQLite-Probe für SQL-Gruppierung (erste Runde 60 %, beste 90 %).
- Klassenmatrix weiterhin hinter Adminsitzung und kein offener Zugriff auf Antworten.
- Reale Cloudflare-D1-Integration erst nach Deployment verifizierbar.
