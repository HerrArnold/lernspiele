# LernSafari2 – Baobab, Briefe und Logbuch: Cloudflare-Freischaltung

## Bereits auf GitHub vorhanden
- Frontend: echtes leeres Postfach, drei Briefarten, read/unread pro Tierkonto, Erfolge im Logbuch, Highscores nach Fach und Thema, Polaroid-Zeitstrahl
- Serverbausteine: `communications-service.mjs`, `communications-d1-store.mjs`, `projects-service.mjs`, `projects-d1-store.mjs`
- Datenbank: `communications-migration.sql`, **zusätzlich** `communications-extras-migration.sql`, `projects-migration.sql`
- Browserfotos werden verkleinert; Veröffentlichung erfordert bestätigte Bildrechte.

## Was im laufenden Cloudflare-Worker noch getan werden muss
Der bestehende produktive Worker ist **nicht** in diesem GitHub-Repository vorhanden. GitHub Pages liefert nur HTML/JS/CSS, nicht die laufende Cloudflare-API. Deshalb kann ein Push diese Worker-Routen oder D1-Tabellen NICHT automatisch aktivieren.

1. Cloudflare → Workers & Pages → Worker **lernsafari-api** öffnen. Vollständigen Worker-Code sowie D1 sichern. Keine Zugangsdaten in GitHub ablegen.
2. Testkopie des Workers und der bestehenden D1-Datenbank verwenden. Vorhandene Login-, Session-, Aufgaben-, Highscore- und Admin-Routen nicht ersetzen.
3. In der Test-D1 `communications-migration.sql` und `projects-migration.sql` **nur falls noch nicht installiert** ausführen. Danach `communications-extras-migration.sql` **einmalig** ausführen. Letztere erweitert die Nachrichtentabelle um `kind` und erstellt die gelesen-Markierungen. Nicht zweimal laufen lassen – die ALTER-Anweisung ist nicht idempotent.
4. Die vier Service-/D1-Module zusätzlich in die tatsächlichen Worker-Dateien übernehmen und importieren. Beispiel für die vorhandene Request-Routingfunktion:

```js
import {createCommunicationsService} from './communications-service.mjs';
import {createD1CommunicationsStore} from './communications-d1-store.mjs';
import {createProjectService} from './projects-service.mjs';
import {createD1ProjectStore} from './projects-d1-store.mjs';

const communicationStore = {
  ...createD1CommunicationsStore(env.DB),
  studentExists: async username => existingStudentExists(username)
};
const communications = createCommunicationsService({
  auth: {
    requireAdmin: existingRequireAdmin,
    optionalChild: existingOptionalChild
  },
  store: communicationStore,
  catalog: SERVER_GAME_CATALOG
});
const projects = createProjectService({
  auth: {requireAdmin:existingRequireAdmin},
  store: createD1ProjectStore(env.DB)
});

const response =
  (await communications.handle(request)) ??
  (await projects.handle(request));
if(response) return addExistingCORSHeaders(response, request);
// Danach bisherige Worker-Routen unverändert bearbeiten.
```

Die Bezeichner `env.DB`, `existingRequireAdmin`, `existingOptionalChild`, `existingStudentExists` und `SERVER_GAME_CATALOG` sind **Platzhalter**: Sie müssen anhand des tatsächlichen Workers angepasst werden. Wichtig: Adminrechte und Kindidentität ausschliesslich über bestehende signierte Sessions prüfen, niemals über ein vom Browser gesendetes Rollenfeld.

5. Auf Test-Worker die Routen prüfen:
   - `GET /projects` (öffentlich, nur veröffentlichte Fotos)
   - `GET/POST/DELETE /admin-projects` (nur Lehrperson)
   - `GET/POST /admin-messages` (nur Lehrperson; `kind`: `message`, `update`, `success`)
   - `GET /messages` (nur angemeldetes Tierkonto, neuesten zuerst, inkl. `read_at`)
   - `POST /messages/read` (nur angemeldetes Tierkonto und nur eigene/öffentliche Briefe)
6. Sicherheit testen: Ohne Admin-Session kein Versand/Upload; Tierkonto A sieht niemals Briefe von B; der Gelesen-Status bleibt für jedes Tierkonto unabhängig. Bei leerer Datenbank muss der Briefkasten leer sein; nach Öffnen eines Briefs ist er grau, nach Neuanmeldung weiterhin gelesen.
7. Prüfen, dass `/admin-learning`, `/learning-plan`, `/highscores`, `/admin-assignments` und `/login` wie bisher funktionieren. Erst nach erfolgreicher Testkopie live veröffentlichen.

## Fach-/Themen-Zuordnung für Highscores
Das Logbuch benutzt bei jedem Aufruf den aktuellen `window.LernSafariTopicCatalog`. Neue Spiele aus diesem Katalog werden automatisch nach Fach und Thema eingeordnet. Bei Spiel-IDs, die im Katalog fehlen, erscheint die neutrale Rubrik «Weitere Spiele». Die Einzelpunkte stammen aus dem vorhandenen `/highscores`-Endpunkt; sie werden nicht erfunden.

## Datenschutz
Die Galerie ist auch für Gäste sichtbar. Nur Fotos verwenden, für die die nötige Veröffentlichungserlaubnis vorliegt. Ein verliehener Erfolg mit Empfänger `all` ist für alle Kinder sichtbar. Persönliche Erfolge an ein einzelnes Tierkonto senden.
