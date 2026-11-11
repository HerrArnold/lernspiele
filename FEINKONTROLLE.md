# LernSafari 2.8 – Feinkontrolle

Die vier Orte wurden auf einheitliche Abstände, Bedienknöpfe, Überschriften und kompakte Auswahlansichten geprüft.

- Lern-Lagune: weniger gleichartige Erklärungsboxen; mehr Platz für die Spiele.
- Tages-Tal: die originalen Aufgaben bleiben eingebettet; der Zurück-Knopf führt zur Karte statt dieselbe Seite erneut zu laden.
- Baobab-Baum: kompaktere Auswahl und weniger wiederholte Überschriften.
- Oase: harmonisierte Spielkarten und einheitliche Navigation.
- Eingebettete Spiele: die zweite interne Kopfzeile mit Schliessen-Knopf wird ausgeblendet. Die Zurück-Navigation der neuen Webseite bleibt bestehen.

**Unverändert:** Originale JavaScript-Dateien, Aufgabendaten und Lernspiel-HTML. Nur die bestehende Safari-Skin-CSS für das Ausblenden der doppelten oberen Leiste wurde ergänzt.

**Technische Prüfung:** Alle JavaScript-Dateien wurden mit `node --check` überprüft; die Originalverzeichnisse sind vollständig. Ein visueller Browser-Klicktest konnte wegen einer Zugriffsblockade für lokale Testseiten nicht durchgeführt werden.
