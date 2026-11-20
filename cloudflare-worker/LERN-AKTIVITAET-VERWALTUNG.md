# LernSafari: Admin-Übersicht für Lern-Lagune, Oase und Baobab

Stand: 20. November 2026. Implementiert auf `main` in `HerrArnold/Lernspiele2` und `HerrArnold/Lernspiele`.

## Benutzeroberfläche

In der Flamingo-Verwaltung gibt es **Lernaktivität nach Inhalt**. Der neue Bereich besteht aus drei Tabellen, deren Inhalte nach Bereich gefiltert werden:

- **🌊 Lern-Lagune:** 48 Angebote aus Mathematik, Deutsch, NMG, Musik und Englisch. Fachfilter und Archivthemen eingeschlossen.
- **🏝️ Oase:** 12 Angebote: Schach, Knobeln, Pokémon Pocket und Kreativatelier.
- **🌳 Baobab-Baum:** 31 Grund- und Einzelinhalte: Klassentiere, 26 Tiersteckbriefe und Tierquizze, Tier-Memory, Tiernamen schreiben, Adventskalender und Erlebnisse. Hinzu kommen die tatsächlich gespeicherten Polaroid-Erlebnisse mit eigenem Titel.

Jeweils Auswahl **Ganze Klasse** (eine Spalte pro Tier) oder **Einzelnes Tier**.

### Was die Zahlen bedeuten

**Abgeschlossene Durchläufe:** tatsächliche, gespeicherte Abschlussereignisse mit erreichten und maximal möglichen Punkten. Angezeigt werden Anzahl, **Prozent des ersten abgeschlossenen Durchlaufs** und **Prozent des besten abgeschlossenen Durchlaufs**.

**Aufrufe:** seit Aktivierung des Tracking-Dienstes tatsächlich absichtlich geöffnete Lerninhalte. Wenn ein Angebot keine bewertbare Gesamtauswertung speichert (z. B. Lexikon, freies Malen, Erlebnisse), erscheint die Zahl der Aufrufe und **keine Prozentangabe**. Ein Aufruf ist ausdrücklich kein nachgewiesener erfolgreicher Durchlauf.

**Einzelprüfungen:** tatsächlich in der alten `game_attempts`-Tabelle gespeicherte Teilaufgaben. Sie werden nicht mit ganzen Durchläufen verwechselt.

**Farbskala nach bestem bewertbarem Durchlauf:** Grün 80–100 %, Gelb 50–79 %, Rot 0–49 %, Grau ohne bewertbare Gesamtauswertung. Die Farben sind rein beschreibend, keine Zeugnisnoten.

Die Daten stehen ausschliesslich in der **Flamingo-Verwaltung** und nicht als Abhakliste im Logbuch der Kinder.

## Daten und historische Grenzen

- Historische abgeschlossene Durchläufe stammen aus `game_attempts` und sind soweit möglich auch vor Einführung der neuen Admin-Übersicht sichtbar.
- **Öffnungszahlen beginnen erst nach der Worker-Veröffentlichung.** Ältere Besuche ohne Ereignisprotokoll können nicht nachträglich rekonstruiert werden.
- Ein Spiel ohne Abschlussereignis bekommt keine erfundene Prozentzahl. Bei einigen alten Spielen sind frühere Abschlussmeldungen nur nach erfolgreicher Verbesserung gespeichert; der erste *historisch gespeicherte* Abschluss muss dann nicht der tatsächlich erste Versuch gewesen sein.
- Die Rabenvogel-Zuordnung wurde geändert: Jetzt speichert jeder vollständig geprüfte Zehnerdurchlauf seinen aktuellen Prozentwert, auch wenn er Fehler enthält.
- Baobab: 26 Tierquizze haben eine echte Schlussauswertung mit acht Fragen erhalten. Tier-Memory wird als Besuch erfasst, aber nicht wegen eines letztendlich gewonnenen Memorys automatisch als «100 % richtig» bewertet.
- Im Bericht werden höchstens 12'000 historische Abschlussdatensätze übertragen; bei der Obergrenze erscheint eine Warnung über möglicherweise unvollständige erste Ergebnisse.
- Individuelle Antworten und sensible Login-Daten werden **nicht** mit dem neuen Bericht übertragen.

## Cloudflare-Worker (noch nicht automatisch veröffentlicht)

Kombiniertes ZIP: `lernsafari-worker-matheplan-lernauswertung-2026-11-20.zip` aus dieser Unterhaltung. Es **ersetzt die ältere Matheplan-Worker-ZIP** und baut auf deren Worker-Version auf.

Das Paket enthält die bereits vorbereiteten Matheplan-, Polaroid-, Briefkasten- und Erfolgsfunktionen sowie:

| Route | Authentifizierung | Zweck |
|---|---|---|
| `POST /learning-visit` | aktives Kind-/Tierkonto | Genau einen bewussten Aufruf eines gültigen Bereichs registrieren |
| `GET /admin-learning-matrix` | aktive Flamingo-Adminsitzung | Aktuelle Klassenmatrix aus Aufrufen, Einzelprüfungen und Abschlussereignissen |

Bei der ersten zulässigen Anfrage wird `safari_learning_visits` idempotent angelegt. Das SQL liegt zusätzlich in `cloudflare-worker/lernaktivitaet-migration.sql`. Bereits gespeicherte Spielversuche und persönliche Matheplan-Häkchen bleiben unverändert.

**Wichtig:** Vor einem Worker-Deploy den aktuellen Cloudflare-Worker sichern und mit dieser Version vergleichen. Eine seit der Matheplan-Version auf Cloudflare eigenständig geänderte Worker-Fassung darf nicht ungeprüft überschrieben werden. Der neue Dienst ist erst nach dem Deploy live.

## D1-Belastung

Keine Zeitsteuerung, keine automatische Klassenabfrage im Hintergrund. Eine kurze Schreibmeldung wird nur bei einem bewussten Öffnen ausgelöst. Der historische Bericht führt Datenbankabfragen **nur beim Öffnen der Admin-Matrix oder Klick auf «Ergebnisse abfragen»** aus. Wegen des früheren D1-Limits sollte der Bericht nicht ständig neu geladen werden. Für eine grosse Historie sind später vorberechnete Statistiken und gezielte Indizes sinnvoll.

## Qualitätssicherung

- JavaScript-Syntax der elf relevanten Frontend- und Katalogdateien geprüft.
- 48 Lern-Lagunen-, 12 Oasen- und 31 Baobab-Grundeinträge kontrolliert.
- Erste/beste Trefferquote und Zuordnung der Tierquizze geprüft.
- Neun Mock-Tests des vollständigen Worker-Routings: Anmeldung, Zugriffsrechte, eigenes Tierkonto, Aufrufzähler, Klassenübersicht und Datenminimierung.
- Ein Live-Test an Cloudflare-D1 ist erst nach dem einmaligen Worker-Deploy möglich.

### Unterrichtsmodus-Bereinigung

In der kombinierten Worker-Version entfallen ausserdem die alten serverseitigen Fokus-Sperrprüfungen bei Spielversuchen. Die Kinder-Lernplanabfrage muss damit keine alten Fokusregeln und Unterrichtsmodi mehr aus D1 laden. Frühere Admin-Endpunkte bleiben vorerst zur Kompatibilität bestehen.
