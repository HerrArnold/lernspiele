# Baobab: Projekte und Erlebnisse – sichere Cloudflare-Anbindung

**Entwicklungsstand (11. November 2026):** Die Webseite, die Polaroid-Galerie, das
Admin-Formular, die sicheren API-Bausteine und die Test-Datenbankmigration liegen im
Branch `lernsafari-camp-direkt`. **Der bestehende produktive Cloudflare-Worker ist
hier nicht verfügbar und diese Bausteine sind noch nicht live angeschlossen.**

## Sichtbare Seite
- Karte: fünf separate HTML-Schilder auf einer SVG-Illustration **ohne Schrift im Bild**.
- Baobab: Klassentiere (öffnet `original/index.html#tiere`), Adventskalender
  (Noch nicht verfügbar), Projekte und Erlebnisse (Polaroid-Fotoalbum).
- Andere alte Bereiche wie Geschichten, Werke, Motto, Komplimente sind nicht sichtbar.
- Adminbereich: neues Feld `Projekte und Erlebnisse` mit Foto, Datum, Titel, Satz
  und ausdrücklicher Bestätigung der Veröffentlichungsberechtigung.
- Wenn die API noch nicht verfügbar ist, bleibt das Admin-Upload-Formular deaktiviert;
  der Kinderbereich zeigt keine erfundenen Klassenfotos.

## Sichere Aktivierung (auf Test-Worker)
1. Backup von Worker-Code und bestehender D1 anfertigen.
2. `projects-migration.sql` nur auf einer **D1-Testdatenbank** ausführen.
3. In den bestehenden Worker, **nicht statt dieses Workers**, integrieren:

```js
import {createProjectService} from './projects-service.mjs';
import {createD1ProjectStore} from './projects-d1-store.mjs';
const projects = createProjectService({
  auth:{requireAdmin:existingRequireAdmin},
  store:createD1ProjectStore(env.DB)
});
const projectResponse=await projects.handle(request);
if(projectResponse)return addExistingCORSHeaders(projectResponse,request);
// Bestehende Worker-Routen weiterverarbeiten.
```

4. API-Endpunkte:
   - `GET /projects` – veröffentlichte Rückblicke; keine private Datenbankinformation
   - `GET /admin-projects` – Administrator-Sitzung erforderlich
   - `POST /admin-projects` – Administrator-Sitzung, gültige JPEG-/PNG-/WebP-Datei
     als verkleinerte Base64-Daten-URL, Datum, Titel, Text und Bestätigung
   - `DELETE /admin-projects` – Administrator-Sitzung erforderlich
5. Im Browser nach Anmeldung ein kleines Testfoto hochladen, Datum setzen,
   Titel eintragen, danach Kinderansicht/privates Fenster prüfen; Bild wieder
   löschen. Unberechtigte Uploads/Datenzugriffe müssen HTTP 403 liefern.

## Datenschutz und Grenzen
- Veröffentlichungen sind öffentlich abrufbar, auch von Gästen. Keine Kinderfotos
  ohne die nötige Freigabe und keine privaten Angaben im Titel/Kommentar verwenden.
- Das Frontend verkleinert Fotos vor dem Senden auf unter 215 KB Base64 und entfernt
  durch Canvas-Neuencodierung viele EXIF-Metadaten.
- Die D1-Tabelle speichert die veröffentlichten Bilddaten vollständig und benötigt
  eine bewusst geregelte Aufbewahrung sowie Löschprozesse.
- Keine Behauptung, dass der Upload auf einem anderen Gerät schon funktioniert,
  solange die API nicht am tatsächlichen Worker läuft.
- Produktivseite `herrarnold.github.io/lernspiele` bleibt unverändert.
