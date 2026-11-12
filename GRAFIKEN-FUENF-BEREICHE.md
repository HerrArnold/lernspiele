# LernSafari – fünf Bildwelten und Farben (Entwicklung)

Stand: 11. November 2026. Nur Branch `lernsafari-camp-direkt` ändern.

| Bereich | Tier als Charakter | Farbe für Knöpfe und Aussenbereiche |
| --- | --- | --- |
| Camp | Flamingo, Reiseleiter / Lehrperson | Flamingorosa |
| Tages-Tal | Hornvogel, täglicher Berater | Himmelblau |
| Lern-Lagune | Erdmännchen, entdecken und üben | Grün |
| Baobab-Baum | Löwe, Organisation / Klassengemeinschaft | Gelb-Braun |
| Oase | Warzenschwein, ruhige Pause und freie Angebote | Türkisblau |

## Grafiken
- `assets/karte-stickerwelt.webp`: Bildkarte 1672×941, Lager in Mitte,
  Tages-Tal oben links, Lern-Lagune oben rechts, Baobab unten links,
  Oase unten rechts; die fünf Tiere jeweils in ihrer Welt; **kein fester
  Text im Bild**.
- `assets/baobab-stickerwelt.webp`: Baobab mit fünf Figuren, stimmiger Savanne,
  freien Plätzen für **drei getrennte HTML-Schilder**.
- `original/assets/hornvogel-zahl-des-tages.webp`: Originalaufkleber
  Hornvogel hält 324 für die Aufgabenbeispiele.

**Transferstatus:** Diese drei WebP-Binärbilder wurden in der Unterhaltung
bereits als herunterladbares Bildpaket vorbereitet, konnten aber mit der
vorhandenen GitHub-Textdatei-Schnittstelle nicht als Binärdateien in den
Branch geschrieben werden. Die Bilder sind daher **noch nicht in GitHub**.
Nach dem Upload an die obigen Zielpfade werden sie ohne Codeänderung
automatisch statt der bereits vorhandenen SVG-Fallbackbilder angezeigt.

- Den `src` und das `onerror`-Fallback nicht entfernen, bis alle drei
  Bilder vorhanden und im Testbrowser bestätigt sind.
- Der Entwicklungszweig enthält für die Fallbackkarte einzelne, nicht
  klickbare Tiersticker; nach Laden der fertigen PNG/WebP-Grafik blendet
  das CSS diese wieder aus, sodass kein Tier doppelt erscheint.
- Der Baobab hat nur diese drei Kinderbereiche: Unsere Klassentiere,
  Adventskalender (noch nicht verfügbar), Projekte und Erlebnisse.
- `original/assets/tierwelt-palette.css` behebt die unleserlichen
  dunklen Infokarten / Eingabe- und Quizfelder, nicht den Tierinhalt.
- `original/assets/tages-tal-palette.css` färbt die eingebetteten
  Tagesaufgaben blau.
- `safari-area-theme.css` ist die gemeinsame Farbschicht der fünf
  Szenen und wird zuletzt geladen.

## Visuelle Kontrolle (Laptop 1366×768)
1. Karte vollständig ohne Scrollen; fünf Schilder klar und ohne
   doppelte Beschriftung; Tiere neben den richtigen Bereichen.
2. Am Baobab genau ein Erdmännchen; keine doppelten Schwänze;
   drei Schilder, alle anderen Bereiche unsichtbar.
3. In «Unsere Klassentiere», insbesondere Spinne: dunkler Text auf
   heller Fläche statt dunkelbraun auf Anthrazit; Quizoptionen,
   Reiter, Feedback und Merkkarten genauso gut lesbar.
4. Beispiel «Zahl des Tages»: Hornvogel mit 324 statt Flamingo;
   keine Änderung der Aufgaben, Lösungen oder Punkte.
5. Camp rosa, Baobab ocker, Tages-Tal blau, Lagune grün,
   Oase ruhig blau/türkis; Kontrast auch im Hover-Zustand.
6. Hauptseite `HerrArnold/lernspiele` nicht verändert.
