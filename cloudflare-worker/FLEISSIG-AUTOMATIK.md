# Automatischer Erfolgsbrief «FLEISSIG» – Zahl des Tages

**Status:** Der Worker-Code wurde vorbereitet und lokal geprüft. Er muss einmal in Cloudflare bei `lernsafari-api` veröffentlicht werden. GitHub Pages allein aktualisiert den Worker nicht.

## Ereignis

Die bestehende Oberfläche `original/assets/zahl-des-tages.js` meldet beim Klick auf **«Prüfen»** bereits die Aufgabe `YYYY-MM-DD – word` als `POST /game-attempt` an Cloudflare. Dafür ist **keine Änderung am Frontend nötig**.

Es zählt der **erste authentifizierte Versuch eines Kind-/Tierkontos an einem Schultag zwischen 08:00:00 und 11:40:59 Uhr in Europe/Zurich**, sofern ein nichtleeres Zahlenwort eingegeben wurde. Richtig schreiben ist für diese Auszeichnung nicht erforderlich: Es geht um das frühe Beginnen, nicht um die Korrektheit.

## Vergabe

- **Briefart:** `success` (Erfolg)
- **Betreff:** `FLEISSIG`
- **Text:** `Der frühe Vogel fängt den Wurm. Du hast heute als erstes Kind damit begonnen, die Aufgaben zur Zahl des Tages zu lösen.`
- **Empfänger:** genau ein Tierkonto, ausschliesslich dessen privater Briefkasten
- **Absender:** `LernSafari-Automatik`

Die Auszeichnung wird beim Eingang des ersten gültigen Überprüfens automatisch und einmalig vergeben; ein zeitgesteuerter Job ist nicht notwendig.

## Datenschutz und Doppelvergaben

Der Worker verifiziert die Benutzeridentität mit der bestehenden Kinder-Sitzung. Die Client-Uhr wird ignoriert; nur der Server bestimmt das Datum und die Uhrzeit. Gäste, Lehrpersonen, Klassenkonten, leere Eingaben, andere Aufgaben und Wochenenden gewinnen nicht. Eine Tabelle mit `PRIMARY KEY(day_date)` verhindert doppelte Sieger. Die Gewinnerauswahl und das Schreiben des Briefs erfolgen in einer D1-Transaktion.

Die neue Tabelle `safari_numberday_first` wird beim ersten qualifizierten Versuch durch `CREATE TABLE IF NOT EXISTS` automatisch angelegt. Es ist daher **keine separate D1-Migration** erforderlich.

## Veröffentlichung

Die vollständige Worker-Datei wird im Gespräch als ZIP zur Verfügung gestellt. In **Cloudflare → Workers & Pages → lernsafari-api → Edit code** muss der Code aus `worker.js` den bisherigen ersetzen und dann **Deploy** gewählt werden.

Der Worker enthält die bislang funktionierenden Routen für Polaroids, Briefkasten und Unterrichtsmodus. Die Python-/Node-Tests des neuen Features wurden lokal ausgeführt, aber die Live-Cloudflare-Berechtigungen konnten nicht getestet werden.

## Tests (lokal)

14 Tests mit SQLite/D1-kompatiblen Statements: Zeitfenster, leere Antworten, falsche Aufgabe, Klassenkonten, falsches Datum, erster falscher Schreibversuch, wiederholte Klicks, ein zweites Kind, neue Tage, Wochenende, nur ein Gewinner und vollständiger Erfolgsbrief.
