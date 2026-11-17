# D1-Lastanalyse – 16. November 2026

## Ausgangslage

Cloudflare Logs vom 16.11.2026: `D1_ERROR: Your account has exceeded D1's free tier daily row read limit`. Die Bindung `DB → lernsafari-db` ist im Worker sichtbar und korrekt eingerichtet. Der Fehler ist ein ausgeschöpftes Tageskontingent, kein belegter Passwortfehler oder Datenbankverlust.

## Befunde nach Quellcodeprüfung

| Fundstelle | Vorher | Bewertung | Änderung auf GitHub |
|---|---|---|---|
| `original/assets/lernhelfer.js` | Beim Anzeigen des Tages-Tals werden Empfehlungen für bis zu vier Tagesaufgaben und sechs Zahl-des-Tages-Aufgaben automatisch angefragt; alle fünf Minuten werden sie erneut vorbereitet. | **Sehr wahrscheinlich grösster Treiber.** Insbesondere `GET /learning-helpers?target=number:...` aggregiert bis zu 45 Tage alte `game_attempts`-Datensätze mit `LIKE '%...'`. | Empfehlungen werden **erst nach explizitem Klick auf «Lernhelfer anzeigen»** berechnet; keine automatischen Datenbankabfragen mehr. |
| `cloudflare-integration.js` | `GET /learning-plan` alle 20 Sekunden pro Kinderkonto plus Fokus- und Sichtbarkeitsereignisse | Hohe konstante Last. Der Worker führt pro Request fünf D1-Abfragen plus Sitzungsprüfung aus. | Intervall 60 Sekunden; Fensterereignisse werden 25 Sekunden entprellt. |
| `original/assets/lernsteuerung.js` | Zusätzlich `GET /learning-plan` alle 45 Sekunden (auf Seiten, die das Modul laden), zusammen mit einer Anwesenheitsmeldung | Doppelte Plan-Abfrage. | Plan nur noch alle 90 Sekunden und nur bei sichtbarer Seite; Anwesenheitsmeldungen bleiben eigenständig alle 45 Sekunden. |
| `/admin-report` im Worker | Liest bis zu 4'000 `activity_log`-Zeilen und 8'000 `game_attempts`-Zeilen pro Abruf, ausserdem `daily_progress` ohne Limit. | Potenziell teuer, sobald viel Spielhistorie vorhanden ist. Allerdings nicht als automatisch laufender Poller belegt. | Keine Daten gelöscht; eine paginierte Statistik-Abfrage wäre die nächste Optimierung. |
| `original/assets/game-zugang.js` | Enthält 15-Sekunden-Prüfung und Fallback auf `/learning-plan`, falls `/classroom-access` fehlt. | **Nur eine potenzielle** Zusatzlast: Für die geprüften aktiven Spielseiten wurde nicht bestätigt, dass dieses Skript überhaupt eingebunden ist. | Kein Eingriff vorgenommen. |
| `/activity-heartbeat` | Alle 45 Sekunden pro sichtbarem Kinderkonto, je eine Sitzungsprüfung und ein UPDATE/UPSERT | Vergleichsweise geringe Datenbank-**Lese**last; die Funktion versorgt die Live-Aktivitätsanzeige. | Nicht abgeschaltet. |

## Grobe Grössenordnung

Mit 17 aktiven Kindern und 10 eingeblendeten Hilfekarten konnten im bisherigen Zustand bis zu `17 × 10 × 12 = 2'040` Lernhelfer-Abfragen pro Stunde entstehen, sofern alle Aufgaben angezeigt wurden und die Hilfekarten alle fünf Minuten neu berechnet wurden. Das ist ein **theoretisches Szenario, keine gemessene tatsächliche Anzahl**.

Wenn nur 2'500 Datenbankzeilen pro solcher Abfrage gelesen wurden, ergäbe das rechnerisch über fünf Millionen gelesene Zeilen in einer Stunde. Der reale Wert muss in D1-Metriken überprüft werden.

## Was fehlt für eine exakte Ursachenmessung?

- Die Cloudflare-D1-Metrik **Rows read** nach Zeitraum und möglichst nach Query
- Die tatsächlichen Tabellengrössen und vorhandenen Indizes der Produktionsdatenbank
- Ein Vergleich der D1-Row-Reads nach der GitHub-Aktualisierung am nächsten Schultag

**Nicht eingreifen:** Keine Tabellen löschen, keine Spielversuche massenhaft entfernen, keine Datenbank zurücksetzen. Die Quotenüberschreitung verschwindet mit dem nächsten täglichen UTC-Reset.

## Schonende Indexprüfung (nur bei verfügbarem D1-Kontingent)

```sql
SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type='index'
  AND tbl_name IN ('game_attempts','sessions','class_assignments',
                   'class_assignment_done','class_assignment_verified',
                   'class_focus_rules','daily_progress')
ORDER BY tbl_name, name;
```

Diese Abfrage liest Schema-Metadaten, nicht die Schülerdaten. Erst nach Sichtung des Ergebnisses entscheiden, ob gezielt Indizes ergänzt werden müssen.

## Veröffentlichungsstatus

Die beschriebenen Frontend-Einsparungen wurden direkt auf `main` in `HerrArnold/Lernspiele2` veröffentlicht. Sie benötigen **keinen Cloudflare-Worker-Deploy**. Der gesonderte, noch nicht veröffentlichte Worker mit «FLEISSIG» und «FEHLERFREI» wurde dadurch nicht überschrieben.
