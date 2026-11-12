# LernSafari2 – Abgleich mit den Lehrpersonen-Wünschen (11. November 2026)

**Geprüft:** GitHub `HerrArnold/Lernspiele2`, Branch `lernsafari-camp-direkt`, die fünf von der Lehrperson hochgeladenen PDF-Aufgaben und die fünf MP3-Audiodateien. **Nicht geprüft:** produktiv angemeldete Cloudflare-Konten, echte D1-Inhalte, Deployment des aktuellen Branch auf Pages oder private Daten.

## 1. Lern-Lagune und Fachfarben

| Wunsch | Status | Beleg / nächste Aktion |
|---|---|---|
| Mathe: Einmaleins (6 Spiele) | **Umgesetzt** | `topic-navigation.js` zeigt alle 6; Original-HTML existiert. |
| Einmaleins: Teste dein Wissen (alle Reihen) | **Bewusst noch nicht erstellt** | `null` im Themenkatalog; Anzeige „In Vorbereitung“. |
| Tausenderraum: 5 Spiele, neue Namen | **Umgesetzt** | Alle 5 Ziele zeigen auf existierende HTML-Dateien, neue Anzeigenamen im Katalog. |
| Tausenderraum: Teste dein Wissen | **Bewusst noch nicht erstellt** | `null` im Themenkatalog; Anzeige „In Vorbereitung“. |
| Deutsch: Briefe, Vom Hören zum Sprechen | **Umgesetzt** | Beide zugeordneten HTML-Seiten vorhanden. |
| Deutsch: Hörverständnis 5 Waldtiere | **Umgesetzt (Aufgaben), Audio-Abhängigkeit offen** | Siehe unten. |
| NMG: 4 Rabenvögel-Spiele | **Umgesetzt** | Alle 4 verlinkten HTML-Seiten vorhanden. |
| Musik: 6 Solmisation/Rhythmus- + 2 SayHi-Spiele | **Umgesetzt** | Alle 8 HTML-Seiten vorhanden. |
| Englisch Unit 2 My Body, 2 Vocabulary-Spiele | **Umgesetzt** | Beide als interne Englisch-Modi eingebunden. |
| Fachfarben Blau/Rot/Grün/Weiss/Gelb | **Umgesetzt** | `integration.css` je Fach. |
| Einheitliche Rechtecksymbole inkl. UK-Flagge | **Umgesetzt** | `assets/math-badge.svg`, `german-flag.svg`, `nmg-leaf.svg`, `music-badge.svg`, `uk-flag.svg`. |
| Themen-Emojis, Spiele Pfeil statt Controller | **Umgesetzt** | `topic-navigation.js`: verfügbare Spiele → Pfeil; nicht verfügbare 🛠️. |

## 2. Zahl des Tages / Tages-Tal

| Wunsch | Status | Beleg / nächste Aktion |
|---|---|---|
| Zahl des Tages über volle verfügbare Breite | **Code umgesetzt; visueller Gerätetest empfohlen** | `original/assets/zahl-des-tages.css`, `.shell:has(#view-aufgaben...)`. |
| Hornvogel mit 324 statt Flamingo im gelösten Beispiel | **SVG-Fallback aktiv; hochgeladenes Originalbild fehlt** | `zahl-des-tages.js` sucht `assets/hornvogel-zahl-des-tages.webp` und verwendet ersatzweise `assets/hornvogel-zahl-des-tages.svg`. |
| Beispiel 5 ohne überlagernde Hunderter-/Zehner-/Einergruppen | **CSS-Korrekturen vorhanden, Browserprüfung der konkreten Problemstelle offen** | `zdt-example-material`, `zdt-artitems` im ZDT-CSS. |
| Rote Balken/Felder bei Materialaufgabe entfernen | **CSS-Korrektur vorhanden, Browserprüfung offen** | `zdt-artrow>strong`, `zdt-artitem` im ZDT-CSS. |
| Zahlenstrahl im richtigen Hunderterabschnitt, maximal 20 Abstand | **Umgesetzt** | `zahl-des-tages.js`, `checkStep('line')`. |
| Schwebende Zahl kleiner/rechts | **Umgesetzt** | `#zahl-des-tages .zdt-number` im CSS. |
| Beispiel-Stellentafel-Punkte deutlicher | **Umgesetzt** | `.zdt-example-dot` dunkler. |
| Zerlegung: Plus normal, kein roter Kasten | **Umgesetzt** | `.zdt-decomp .zdt-plus` helles neutrales Design. |
| Zerlegung: Eingabe „Deine Antwort“ | **Im Code vorhanden** | `zahl-des-tages.js` (bei visueller Prüfung nachsehen). |
| Tages-Tal orange | **Umgesetzt** | `safari-area-theme.css`, `tages-tal-palette.css`. |

## 3. Hörverständnis – Quellen und Bewertung

| Tier | Punkte | Teilpunkte (Lücke / R-F-N / Auswahl / Korrigieren) | Status |
|---|---:|---|---|
| Dachs | 55 | 13 / 8 / 7 / 27 | HTML/JSON vorhanden |
| Eichhörnchen | 54 | 12 / 8 / 7 / 27 | HTML/JSON vorhanden |
| Igel | 48 | 10 / 8 / 6 / 24 | HTML/JSON vorhanden |
| Reh | 60 | 15 / 10 / 8 / 27 | HTML/JSON vorhanden |
| Rotfuchs | 46 | 12 / 8 / 5 / 21 | HTML/JSON vorhanden |

- Vier Aufgabentypen, kompakter Browser-Audioplayer, zehn Sekunden zurück, Neustart, strikte Lückenschreibung, 3 Antwortfelder je Aussage, Checkboxen, ganze Sätze korrigieren und Punktübersicht: **im Code vorhanden**.
- Alle Versuche **pro Gerät und Konto** im Browser-LocalStorage. Nicht automatisch zwischen Laptops synchron. Ein Versuch wird zusätzlich nach Möglichkeit an `/game-attempt` gesendet; die tatsächliche Worker-Aufnahme ist nicht verifiziert.
- Audiodateien in `hoerverstehen-data/*.json` zeigen auf externe MP3-URLs bei `grundschul-blog.de`. Sie sind **nicht als selbst gehostete MP3s im GitHub-Branch vorhanden**. Externes Laden, Verfügbarkeit und Lizenz zur Veröffentlichung sind separat zu prüfen.
- Punkteschema `3 pro korrigiertem Satz` wird mit 3 Kriterien bewertet. Wegen automatischer Teilpunktvergabe können inhaltlich alternative richtige Antworten Nachkontrolle durch die Lehrperson brauchen.
- **Quellenunterschiede:** Beim Eichhörnchen wird im Lauftext „Tierchen“, in der PDF-Lösung „Tiere“ verwendet; die Website akzeptiert beide. Beim Dachs lautet die PDF-Lösung an einer Stelle „kleine Vögel“, der Hörtext nennt „junge Vögel“ und die Webseite verwendet „junge Vögel“: Diese Differenz bei der Lehrperson abstimmen, statt den Erwartungswert stillschweigend zu ändern.
- **Offline-Paket existiert** als `Hoerverstaendnis_Waldtiere_Klassenunabhaengig_mit_Original_Dachs.zip` in der Unterhaltung. Keine Klasse-3b-Aufschrift.

## 4. Verwaltung / Unterrichtsmodi / Cloudflare

- Dashboard **Lernaufträge, Unterrichtsmodus, Lernfortschritte, Live-Aktivität, Nachrichten, Projekte und Erlebnisse**: Frontend vorhanden in `admin-dashboard.js`.
- Zuweisung entlang der Bereiche/Fächer/Themen/Spiele: Frontend vorhanden; sichere Datenbankpersistenz nur mit verbundenem Worker überprüfbar.
- Ankunftszeit/Fachunterricht/Entdeckungszeit und Sperren: Client + vorbereitete Cloudflare-Module vorhanden; **auf dem aktiven Worker nicht nachweislich verbunden**.
- Nur vertrauenswürdig bestätigte Erledigungen dürfen Pflichtaufträge entsperren; direkte Links zu statischen Spielseiten sind ohne serverseitigen Schutz eine mögliche Umgehung.
- Nachrichten und Live-Aktivität: Frontend + Worker-Modul vorhanden; End-to-End mit echten Konten und D1 **offen**.
- Foto-Polaroids: Oberfläche + Datenbankmigration + Worker-Modul vorhanden; Upload und Veröffentlichung auf echter Cloudflare-Infrastruktur **offen**.
- Geteilte Klassenkonten 3a/3c/3d, parallele Geräte: Frontend akzeptiert Klassenrolle, Login ist im Browser dauerhaft; **gleichzeitige Worker-Sitzungen** müssen im echten Backend überprüft werden.
- Flamingo wird nach Admin-Login als „Flamingo“ angezeigt; Administrator-Token bleibt tabgebunden.

## 5. Karte / Baobab / Farbkonzept

- Camp Flamingorosa, Baobab Gelb-Braun, Tages-Tal Orange, Lern-Lagune Grün, Oase Blau: **CSS umgesetzt**.
- Neue, von der Lehrperson hochgeladene Originalgrafiken `karte-stickerwelt.webp`, `baobab-stickerwelt.webp`, `hornvogel-zahl-des-tages.webp`: **fehlen im GitHub-Branch**; aktuell werden SVGs/ältere Illustrationen geladen. Das Bildpaket in der Unterhaltung enthält die erwarteten Dateien.
- Platzierte HTML-Knöpfe, keine eingebrannten Schilder, 3 Baobab-Auswahlpunkte: **Frontend umgesetzt**, endgültiges visuelles Feintuning erst mit den echten Bildern möglich.
- Dunkelmodus-Stylesheet gelöscht; weitere dunkle kontrastarme Textflächen durch helle Overrides korrigiert; automatischer Laptop-Browsertest erfolgreich. Wiederholte Prüfung nach Einbau der Bilddateien sinnvoll.

## Empfohlene Fertigstellungsreihenfolge

1. **Originalillustrationen** in die vorgesehenen GitHub-Pfade übertragen, dann 1366×768 visuell prüfen (Tierfiguren/Knöpfe/Freiflächen).
2. **Hörverständnis-Audios** auf zuverlässige zugelassene Quelle legen; Urheberrechte/öffentliche Nutzung abklären, bei Bedarf unter Anmeldeberechtigung stellen.
3. Cloudflare-Test-Worker mit bestehenden Authentifizierungsrouten und den vorbereiteten D1-Migrationen verbinden. **Nichts ungeprüft auf den Produktiv-Worker deployen.**
4. End-to-End-Kontrolle mit zwei gleichzeitig angemeldeten Geräten für 3a und je einem Tierkonto, Unterrichtsmodus-Sperren, Nachrichten, Lernfortschritte und Projekten.
5. Mit dem Klassenlaptop **Zahl des Tages: Beispiel 5, Materialaufgabe 5, Zahlenstrahl und schwebende Zahl** durchgehen; nach Bedarf pixelgenaue CSS-Korrekturen.
6. Optional die beiden Mathematik-„Teste dein Wissen“-Spiele entwickeln; bis dahin bewusst als „In Vorbereitung“ belassen.

**Produktiv-Repository `HerrArnold/lernspiele` wurde nicht verändert.**
