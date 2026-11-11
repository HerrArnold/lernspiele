# Cloudflare-Worker-Anbindung für LernSafari 3.4

**Stand:** vollständig entworfene, separat getestete Worker-Erweiterung. **Nicht deployed und nicht mit dem privaten produktiven Worker zusammengeführt.** Der bestehende Worker-Quellcode ist in den zugänglichen GitHub-Repositories nicht vorhanden. Niemals die laufende Cloudflare-Worker-Datei durch diese Module ersetzen.

## Dateien
- `classroom-service.mjs`: autorisierte API-Routen und individuelle Zugangsentscheidung
- `classroom-d1-store.mjs`: D1-Speicherung der Modi und bestätigten Erledigungen, inkl. Auditprotokoll
- `classroom-migration.sql`: drei **zusätzliche** Datenbanktabellen
- `../tests/cloudflare-classroom-service.test.mjs`: Berechtigungstests in GitHub Actions

## Erforderliche Integration in den EXISTIERENDEN Worker

1. **Worker-Code und D1 sichern** und bestehende Zugangslogik/Tabellennamen prüfen. Keine Änderung an Live, bevor die Preview-Laufzeit gesichert ist.
2. Migrieren: `classroom-migration.sql` auf einer **Testkopie** der D1-Datenbank ausführen. Bestehende Tabellen werden nicht verändert.
3. Im Worker die existierenden, bereits abgesicherten Authentisierungsfunktionen als Adapter verwenden:
   - `requireAdmin(request)` muss die bisherige Cloudflare-Lehrpersonen-Session serverseitig prüfen und bei Erfolg `{username:...}` zurückgeben; **keine** Admin-Identität aus Request-Body oder Query übernehmen.
   - `optionalChild(request)` muss das vorhandene Bearer-Sitzungstoken prüfen und nur dann den verifizierten Tiernamen liefern.
   - Die bestehenden Zuweisungen lesen: `getAssignmentDefinitions(ids)` liefert Aufträge mit `id,kind,target,audience,username,start_at,end_at`. `getChildAssignments(username)` filtert anhand der realen Gruppe / Tierkonto.
   - `studentExists(username)` bestätigt ein derzeitiges Schulkonto anhand der vorhandenen Datenbank.
4. D1-Adapter erstellen:
```js
import {createClassroomService} from './classroom-service.mjs';
import {createD1ClassroomStore} from './classroom-d1-store.mjs';

const store=createD1ClassroomStore(env.DB,{
  getAssignmentDefinitions: ids => /* bestehende D1-Zuweisungsabfrage */,
  getChildAssignments: name => /* nur aktuell gültige Zuweisungen für dieses Kind */,
  studentExists: name => /* existiert authentisches Tierkonto? */
});
const service=createClassroomService({
  auth:{requireAdmin:existingRequireAdmin,optionalChild:existingOptionalChild},
  store,
  catalog:SERVER_GAME_CATALOG // aus sicheren Worker-Konstanten
});
const response=await service.handle(request);
if(response)return addExistingCORSHeaders(response,request);
// bestehende Worker-Routen weiterverwenden
```
5. **Erweitern** der bestehenden authentifizierten Antwort von `GET /learning-plan`:
```js
const originalPlan=await existingLearningPlan(childUser);
const enrichedPlan=await service.childPlan(childUser.username,originalPlan);
return json(enrichedPlan);
```
6. **Wichtig für bestehendes UI:** Die neue Lehrpersonenverwaltung fragt `GET /admin-classroom-mode` ab, schaltet die Modus-Knöpfe aber nur bei `available:true` frei. Das steht erst nach tatsächlichem Serveranschluss zur Verfügung.

## Neue APIs (geschützt)
- `GET /admin-classroom-mode` – nur autorisierte Lehrperson; aktueller Modus
- `POST /admin-classroom-mode` – nur autorisierte Lehrperson; prüft Typ, Fach, Aufgaben-IDs, Auslaufzeit und Fachzuordnung
- `POST /admin-verify-assignment` – nur Lehrperson, Body `{username,assignment_id,verified:boolean}`; aktuelles Schulkonto und Zuweisung prüfen, Vorgang protokollieren
- `GET /classroom-access?game=<id>` – Kind anhand Bearer-Token oder Gastmodus prüfen; gibt **nur** `{allowed:boolean}` aus
- `GET /learning-plan` – bestehender Endpunkt, neu ergänzt um `verified` und individuellen `classroomMode`

## Fachliche Regeln
- `arrival`: Zahl und Aufgaben des Tages stehen zunächst im Mittelpunkt.
- `subject`: aktuelle Pflichtaufträge aus einem Fach; nach Freigabe darf das Kind frei weiterarbeiten.
- `free`: Gäste und angemeldete Kinder dürfen öffentliche Spiele benutzen.
- `closed`: Spiele unabhängig von der Anmeldung nicht freigegeben.
- Neue Aufgaben-IDs führen beim nächsten Fachmodus erneut zur Sperre; frühere geprüfte Aufträge behalten ihren Nachweis.
- `done` ist eine Eigenbestätigung des Kindes; `verified` wird **nur durch eine autorisierte Lehrpersonenfreigabe** gesetzt. Die automatische fachliche Bewertung muss künftig mit eigenen, nachweisbar korrekten Regeln erweitert werden.
- Wenn keine Pflichtaufträge zugewiesen sind, muss der Unterrichtsmodus für das Kind **nicht** eigenmächtig als «erledigt» gelten. Das aktuelle Frontend behandelt diesen Fall vorsichtig als gesperrt. Die Lehrperson sollte deshalb vor der Aktivierung Pflichtaufträge für **alle** betroffenen Kinder überprüfen.

## Sicherheits- und Datenschutzprüfung vor Deployment
- Keine Authentisierungsdaten oder Admincode im GitHub-Code; keine Schlüsseldaten in Konsole / Log.
- API-CORS nur für die vertrauenswürdige LernSafari-Domain und die Preview-Domain; nicht beliebige Origins reflektieren. CORS-OPTIONS korrekt beantworten.
- Nur bekannte, öffentliche Spiel-IDs im Worker-Katalog erlauben. Keine frei wählbaren Dateipfade durch Nutzereingaben.
- `/classroom-access` liefert **niemals** Schülernamen, Aufgaben oder Ergebnisse an Gäste.
- Bei fehlgeschlagener Worker-/D1-Abfrage ist der Browser-Zugang gesperrt.
- Echte **HTTP-Dateisperre** verlangt zusätzlich private Spielressourcen/Cloudflare Pages Functions; diese Service-API alleine verhindert bloss die spielbare Browseroberfläche.
- Freigabetest: Lehrperson → Ankunft → Fachwechsel → Überprüfung → Freischaltung → neuer Auftrag → erneute Sperre → Schluss → Gäste / direkte URL / verschiedene Tierkonten / Zeitablauf.

## Noch offen
Der bestehende Worker-Code muss zuerst vorliegen. Danach sind Integrations- und Live-Tests auf einer Testumgebung zwingend. Die produktive Version 3.2 und der 3.3-Lernberichts-Entwurf bleiben unberührt.
