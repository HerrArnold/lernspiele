# Mehrere Fotos pro Baobab-Polaroid – Cloudflare integrieren

**Stand 13. November 2026.** Webseite: `HerrArnold/Lernspiele2/main`. Worker: der bestehende `lernsafari-api` mit eigener Anmeldung, D1 und Adminsitzungen.

## Was die Webseite erwartet

- `GET /projects` öffentlich → `{available:true,projects:[{id,date,title,caption,image,photo_count}]}`
  - `image` = unverändertes Titelbild
  - `photo_count` = Titelbild **plus** Zusatzfotos (1–9)
- `GET /project-photos?id=123` öffentlich → `{available:true,photos:[{id,image},...]}`
  - Die grossen Zusatzbilder werden erst nach Klick auf das Polaroid geladen.
- `GET /admin-projects` Admin → Projektliste samt `photo_count`
- `POST /admin-projects` Admin → Titelbild + Titel + Datum + Beschreibung veröffentlichen (unverändert)
- `DELETE /admin-projects` Admin → ganzes Projekt einschliesslich Zusatzfotos löschen
- `POST /admin-project-photos` Admin → ein zusätzliches Bild hinzufügen. JSON: `{project_id:123,image:"data:image/jpeg;base64,...",photo_permission_confirmed:true}`
- `DELETE /admin-project-photos` Admin → einzelnes Zusatzbild löschen. JSON: `{id:45}`

Maximal **acht** Zusatzbilder pro Projekt. Das Titelbild bleibt dauerhaft separat gespeichert.

## Cloudflare-Schritte (zuerst mit Testkopie!)

1. Gehe zu **Workers & Pages → lernsafari-api**. Sichere den **vollständigen bisherigen Worker-Quellcode** und fertige eine Sicherung der bestehenden D1-Datenbank an. Passwörter oder API-Tokens nicht in einen Chat oder ein öffentliches GitHub-Repository kopieren.
2. Öffne **Workers & Pages → lernsafari-api → Settings → Bindings** und notiere den Namen der D1-Bindung (z. B. `DB`; dies ist nur ein Beispiel). Prüfe, welche Datenbank wirklich verknüpft ist.
3. Arbeite zuerst mit einer Testkopie des Workers und der Datenbank. Öffne **Storage & databases → D1 → [Test-Datenbank] → Console** und prüfe, ob die Tabelle `safari_projects` schon vorhanden ist. Wenn nicht, muss zuerst `projects-migration.sql` aus diesem Ordner angewendet werden. Bestehende Tabellen nie löschen.
4. Führe die zusätzliche SQL-Datei **`projects-extra-photos-migration.sql`** aus. Sie erstellt `safari_project_photos` mit der Zuordnung `project_id`. Bereits gespeicherte Projekte und ihre Titelbilder werden **nicht** verändert. Die SQL-Anweisungen verwenden `CREATE TABLE IF NOT EXISTS` und dürfen bei korrektem Schema wiederholt werden.
5. Übertrage folgende zwei aktualisierte Dateien **zusätzlich** in die bestehende Worker-Codebasis:
   - `cloudflare-worker/projects-service.mjs`
   - `cloudflare-worker/projects-d1-store.mjs`
   Falls die beiden Module schon eingebunden sind, aktualisiere die vorhandenen Fassungen. **Keinesfalls die gesamte Worker-Quelldatei durch eines dieser Module ersetzen.**
6. In der bestehenden Request-Funktion das Projektmodul mit den **wirklichen** Authentisierungs- und D1-Funktionen verbinden. Die folgende Skizze enthält Platzhalter:

```js
import { createProjectService } from './projects-service.mjs';
import { createD1ProjectStore } from './projects-d1-store.mjs';

const service = createProjectService({
  auth: { requireAdmin: EXISTING_ADMIN_SESSION_CHECKER },
  store: createD1ProjectStore(env.ACTUAL_D1_BINDING)
});
const projectResponse = await service.handle(request);
if (projectResponse) return WITH_EXISTING_CORS(projectResponse,request);
// Anschliessend laufen die bisherigen Worker-Routen wie gewohnt weiter.
```

Der `EXISTING_ADMIN_SESSION_CHECKER` muss die verifizierte bestehende Administrator-Sitzung prüfen. Der Benutzer darf die Berechtigung nicht über ein beliebiges Browserfeld selbst setzen. `env.ACTUAL_D1_BINDING` sowie CORS-Funktion sind an deinen echten Worker anzupassen.

7. Nur im Test-Worker veröffentlichen. Teste:
   - Ohne Login: `GET /projects` und `GET /project-photos?id=1` dürfen nur öffentliche, tatsächlich veröffentlichte Fotos zurückgeben.
   - Ohne Admin: `POST /admin-project-photos` muss mit **401 oder 403** abgewiesen werden.
   - Mit Admin: Ein Erlebnis mit Titelbild erstellen; zwei weitere Fotos anhängen; Anzeige **«3 Fotos»** prüfen; das Polaroid öffnen und mit Pfeiltasten durchblättern.
   - Beim Hochladen **mehr als acht** zusätzliche Bilder muss der Server ablehnen.
   - Altes Projekt ohne Zusatzfotos bleibt sichtbar und vergrösserbar.
   - Alle bisherigen Routen (`/login`, `/me`, `/learning-plan`, `/highscores`, `/admin-projects`) bleiben funktionstüchtig.
8. Nach Erfolg dieselben **additiven** Schritte mit Backup auf dem laufenden Worker und seiner D1-Datenbank anwenden und die neue Version bereitstellen.

## Zusätzliches Nachrichten- und Erfolgesystem

Die früher vorbereiteten Briefe, Gelesen-Markierungen und Auszeichnungen benötigen weiterhin die separaten Dateien `communications-service.mjs`, `communications-d1-store.mjs`, `communications-migration.sql`, `communications-extras-migration.sql`. Die vollständige Anleitung dazu ist unter `AUSROLLUNG-NACHRICHTEN-PROJEKTE.md` hinterlegt.

## Falls du den Worker-Code im Chat bereitstellst

Bitte nur die **Quelldatei**, ohne Passwörter, Cookies, Tokens, Zugangsschlüssel oder echte Schülerdaten. Damit lässt sich der echte Import-/Routingabschnitt gezielt fertig einpassen, ohne bestehende Login- oder Lernfortschrittsfunktionen zu überschreiben.
