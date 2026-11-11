# LernSafari – Version 2.0 (Originalinhalte übernommen)

## Start
`index.html` öffnen, als Gast eintreten, Camp → Karte → Lern-Lagune/Tages-Tal/Baobab-Baum/Oase.

## Integrierte Originalinhalte
- Lern-Lagune: **29 Originalspiele** (Mathe 13, Deutsch 2, NMG 4, Musik 8, Allgemein/Schach 2). Die Allgemein-/Schachspiele erscheinen in der Oase. Englisch verwendet noch das Voci-Modul aus der bisherigen neuen LernSafari, weil im hochgeladenen Originalprojekt kein Englischspiel gelistet ist.
- Tages-Tal: originale Zahl des Tages mit sechs Unteraufgaben und vier weitere Original-Tagesaufgaben, originale Serien-, Datums- und Prüflogik. Kein Wechsel zu den vereinfachten Demo-Tagesfragen.
- Baobab-Baum: originale Tierwelt mit ihren Bildern, Texten und Interaktionen. Geschichten und Motto bleiben als eigene, noch nicht mit Originalinhalten gefüllte Bereiche der neuen LernSafari bestehen. Der Adventskalender der Originalseite ist aktuell eine Baustellenseite; das bleibt bewusst so und ist nicht als fertig gekennzeichnet.
- Oase: originale Schach-Lexikon- und Schach-gegen-Computer-Seiten.

## Wie der Schutz der Logik funktioniert
Die hochgeladene Originalwebseite befindet sich vollständig im Unterordner `original/`. Original-JavaScript, Original-Daten und die Frage-/Spielmechanik wurden NICHT verändert. An HTML-Dateien wurden lediglich die Stylesheet-Datei `new-safari-skin.css` und der Navigations-Helfer `new-safari-bridge.js` ergänzt. Die Safari-Shell öffnet Originalangebote in einem eingebetteten Rahmen, die neuen Fachkacheln stammen aus dem Original-Spielekatalog. Der Helfer ändert nur die Rücknavigation, nicht die Aufgaben.

## Hinweise
Dies ist weiterhin ein Prototyp und keine produktiv sichere Schülerplattform. Die Originalseite enthält Funktionen, die im veröffentlichten System Hosting-/Cloudflare-Dienste bzw. Authentifizierung benötigen; echte Nutzerkonten, Speicherung und Administration sind mit der neuen Hülle noch nicht integriert. Bitte die bestehenden Hosting-Einstellungen und Rechte vor der Veröffentlichung prüfen. Externe Foto- und Videoinhalte benötigen Netzwerk und gegebenenfalls Lizenzprüfung. Bei geöffneten Originalspielen kann das eingebettete Fenster zum Scrollen dienen.

## Tests
- Alle 29 Spiel-HTML-Dateien und die im Originalkatalog benannten Vorschaubilder vorhanden.
- JavaScript-Syntax `app.js` und `integration.js` geprüft.
- Ein visueller Browsertest wurde in dieser Laufzeit durch die Sperre der lokalen URL verhindert; keine Behauptung eines erfolgreichen visuellen Tests.


Version 2.1
- Alle eingebetteten Originalspiele farblich an die neue LernSafari angepasst, ohne die Spiellogik zu verändern.
- Helle, gut lesbare Safari-Oberflächen mit einheitlichen Flächen, Buttons und Eingabefeldern.
- Neue einfache Vorschau-Bilder für die Lernspiele im Farbkonzept der LernSafari.
- Zusätzlich neue Vorschaubilder für die beiden bisherigen Karten ohne eigenes Vorschaubild: «Teste dein Wissen» in Musik und Mathe.


Version 2.2
- Ursache behoben: Die eingebetteten Originalspiele luden noch zusätzlich die alte Datei `lernsafari-dark.css`.
- Diese Darkmode-Datei wurde aus den eingebetteten Original-Spielseiten und aus dem eingebetteten Original-Hauptbereich entfernt.
- Dadurch greifen nun die hellen LernSafari-Farben auch in den eigentlichen Spieloberflächen statt nur bei den Vorschauen.


Version 2.3
- «Einmaleins-Tafel erforschen» auf helle LernSafari-Farben umgestellt.
- «SayHi: Singen» und «SayHi: Tanz» aus der dunklen Sonderdarstellung in die helle LernSafari-Gestaltung überführt.
- Funktionen und Inhalte unverändert; nur das Design wurde vereinheitlicht.


Version 2.4 – Systematische Restkontrolle
- 29 Originalspielseiten sowie eingebettete Tagesaufgaben und Tierwelt auf verbliebene dunkle Einzelstile geprüft.
- Einheitliche helle Karten, Beschriftungen, Bedienflächen, Hinweise und Auswahlfelder, mit gezielten Korrekturen in gemeinsamen CSS-Regeln.
- Überbreite CSS-Selektoren korrigiert, um das Schachbrett und Unterrichtsmaterial nicht versehentlich umzufärben.
- Alte dunkle Lernsteuerungs-/To-Do-/Lernhelfer-Karten ebenfalls mit dem Safari-Farbkonzept harmonisiert.
- Alle JavaScript-Dateien wurden per SHA-256 gegen Version 2.3 verglichen: unverändert.
- Automatisierte visuelle Browserprüfung in dieser Laufzeit blockiert; daher wird keine visuelle Funktionsgarantie gegeben.


Version 2.5
- Tages-Tal: Lesbarkeit der Texte und Karten gezielt verbessert.
- Zahl des Tages: dunkles Sonderfarbschema vollständig durch eine helle LernSafari-Version ersetzt.
- Hunderter-, Zehner- und Einer-Darstellungen farblich korrigiert und besser lesbar gemacht.


Version 2.6
- Übernommene Originalinhalte enger in die neue LernSafari eingebettet.
- Stärkerer Safari-Rahmen für Lern-Lagune, Tages-Tal, Baobab-Baum und Oase.
- Bessere Rückwege, Breadcrumbs, Kontextkarten und rahmende Einführungen.
- Spiel- und Aufgabenlogik unverändert; überarbeitet wurden Einbettung, Struktur und Stil.


Version 2.7
- Abstände, Grössen und Kartenraster weiter vereinheitlicht.
- Buttons, Rückwege und Überschriften im gesamten Safari-Rahmen stärker harmonisiert.
- Lern-Lagune, Tages-Tal, Baobab-Baum und Oase noch safarimässiger eingerahmt.
- Rücknavigation aus eingebetteten Spielen verbessert: Rücksprünge führen nun gezielter an die passende Stelle zurück.
- Weitere Reststellen des älteren Gesamtstils im äusseren Rahmen bereinigt.


Version 2.8 – Feinkontrolle der vier Orte
- Lern-Lagune: Fächer und Spiele kompakter, Spielansicht breiter.
- Tages-Tal: unnötige doppelte Titel entfernt, Zurück führt zur Karte.
- Baobab-Baum: einheitlichere Navigation und ruhigere Auswahl.
- Oase: gleiche Karten und Buttons wie bei den anderen Orten.
- Doppelte Infokästen entfernt; Spielskripte und Aufgaben unverändert.
- Browserprüfung im lokalen Server durch Umgebungsrichtlinien blockiert.


## Version 2.9 – Benutzerverwaltung (lokale Funktionsdemo)
- Neue Schaltfläche «Verwaltung testen» am Anmeldebildschirm.
- Browserbasierte Demo-Verwaltung: Aufgabe zuweisen, Fälligkeit festlegen, sichtbar/verborgen setzen, löschen und lokalen Demo-Fortschritt ansehen.
- Kinder-Demo-Logbuch zeigt veröffentlichte Aufgaben, Öffnen-Funktion und manuelle Erledigt-Kennzeichnung.
- Originalspiele können Übungsantworten an das lokale Demo-Logbuch melden, ohne dass die Bewertung verändert wird.
- Lokale Speicherung nur in diesem Browser (localStorage). Keine echte Anmeldung, keine serverseitige Berechtigungsprüfung, keine Mehrgeräte-Synchronisation. Keine Schülerdaten verwenden.
- Die bisherige Original-Backend-Schnittstelle wurde nicht mit dem neuen Login verbunden. Für Produktion sind Hosting, sichere Authentifizierung, Datenmodell, Rechte und Datenschutz separat umzusetzen.

Version 3.0 – GitHub Pages + bestehende Cloudflare-Verwaltung
- Echter Tierkonto-Login über bestehende Worker-API, kein clientseitig vorgetäuschter Zugang.
- Cloudflare-Lernaufträge, Erledigt-Häkchen, Highscores, Wochenagenda und geschützte Admin-Anmeldung in die neue Startseite integriert.
- Vollständige bisherige Verwaltung bleibt über den Adminbereich erreichbar.
- Demo-Zugänge bleiben sichtbar als ausdrücklich gekennzeichnete **lokale Demo**.
- Keine Worker-Datenbank, Login-Secret oder Berechtigung wird aus dem Frontend erstellt; siehe CLOUDFLARE-GITHUB-SETUP.md.


Version 3.1 – Diagnostik und Testfreigabe
- `diagnose.html` zum Test der öffentlichen Dateiauslieferung und Cloudflare-Erreichbarkeit, ohne Zugangsdaten.
- `pruefen.mjs` für reproduzierbare lokale statische Prüfungen (`node pruefen.mjs`).
- `TESTFREIGABE.md` für GitHub-Staging, CORS und Rollen-/Datenschutztests.
- Originalspiele und Benutzerlogik gegenüber 3.0 unverändert.


## Version 3.2 – Lernfortschritt aus Cloudflare
- Kinder-Logbuch zeigt den serverseitig gespeicherten Highscore direkt bei zugewiesenen Spielen und eine Zusammenfassung der geübten Spiele.
- Die Lehrperson kann im Adminbereich einen lesenden Klassenbericht mit Highscore-/Lernversuchszahlen pro Tierkonto öffnen.
- Die Datensätze werden ausschliesslich nach erfolgreicher serverseitiger Anmeldung über bestehende API-Endpunkte abgefragt (`/highscores` und `/admin-report`).
- Die automatische Speicherung der Lernversuche durch bestehende Originalspiele wird nicht verändert.
- Highscores und Lernversuche werden absichtlich **nicht** als Beweis für eine abgeschlossene Pflichtaufgabe gewertet; Häkchen bleiben separat.
- Kein Backend- oder Produktionsbranch-Update; nur in einem neuen Entwicklungsbranch testen.