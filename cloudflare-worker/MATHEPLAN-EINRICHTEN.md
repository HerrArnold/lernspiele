# Matheplan im persönlichen Logbuch – Klasse 3b

## Stand: 20. November 2026

Die LernSafari bietet unter **Mein Logbuch** jetzt drei klar getrennte Bereiche:
**Matheplan**, **Aufträge** und **Erfolge** (verliehene Brief-Erfolge und Highscores).

Im Matheplan sind die 20 Aufgaben aus dem hochgeladenen Unterrichtsplan erfasst:
- **Grundaufgaben:** 14 Aufgaben
- **Erweiterte Aufgaben:** 3 Aufgaben
- **Forscherzone:** 3 Aufgaben

Die Aufgaben und ihre Lernzielzuordnung stehen in `math-plan-data.js`. Die Oberfläche steht in `math-plan-ui.js`; die Erweiterungen im Logbuch und im Flamingo-Adminbereich sind direkt auf `main` gespeichert.

## Cloudflare-Worker: noch einmalig nötig

Das GitHub-Frontend allein kann die persönlichen Häkchen nicht dauerhaft und geräteübergreifend speichern.

Die zu diesem Arbeitsstand vorbereitete **komplette Worker-ZIP** heisst
`lernsafari-worker-matheplan-2026-11-20.zip` und wurde im Chat bereitgestellt. Sie enthält `worker.js` und eine Installationsanleitung.

**Vor einem Deploy die derzeit aktive Worker-Datei sichern.** Die integrierte Vorlage basiert auf der zuletzt im Gespräch verfügbaren kombinierten Erfolgs-Version vom 16.11.2026. Falls seitdem auf Cloudflare ohne GitHub weitere Änderungen vorgenommen wurden, müssen diese zuerst eingearbeitet werden. Andernfalls könnten funktionierende Funktionen überschrieben werden.

Die neue D1-Tabelle wird beim ersten zulässigen Request automatisch angelegt. Alternativ steht dieselbe idempotente Migration unter `cloudflare-worker/matheplan-migration.sql`.

### Neue API-Routen

| Methode | Route | Berechtigung | Funktion |
|---|---|---|---|
| GET | /math-plan | gültiges Tierkonto | Eigene Häkchen abrufen |
| POST | /math-plan | gültiges Tierkonto | Ein eigenes Häkchen setzen oder zurücknehmen |
| GET | /admin-math-plan | gültige Flamingo-Adminsitzung | Gesamte Klassenmatrix und einzelne Tierkonten |

Kinder können weder fremde Häkchen bearbeiten noch die Klassenübersicht lesen.
Der Server akzeptiert ausschliesslich die 20 festen Aufgabenkennungen.
Die Tabelle verwendet die vorhandene `users.id` statt von einem Kind übermittelte Kontonamen.

### Benötigte Tabellenstruktur

```sql
CREATE TABLE IF NOT EXISTS safari_math_plan_done (
  user_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,task_id)
);
```

## Verhalten bei fehlendem Worker

Solange die Serverfunktion nicht live ist, sind die Matheplan-Aufgaben und Spiel-Verknüpfungen sichtbar. **Die Häkchen sind bewusst deaktiviert**, damit kein Kind fälschlicherweise glaubt, sein Fortschritt sei gespeichert. Im Flamingo-Bereich erscheint ein Hinweis auf den fehlenden Dienst.

## Tests

- 20 feste Aufgabennummern, 14/3/3 Kategorien und GitHub-Skriptreihenfolge kontrolliert
- JavaScript-Syntax der geänderten Frontenddateien überprüft
- 10 Mock-Worker-Tests: Lesezugriff, Setzen, Zurücknehmen, ungültige Aufgaben, falsche Werte, Admin-Schutz, Klassenmatrix und Tabellenerstellung
- Realer Browsertest und Cloudflare-D1-Schreibtest erst nach dem Worker-Deploy möglich

Bestehende Aufträge, Erfolge, Polaroids, Highscores und Schülerdaten werden nicht gelöscht.
