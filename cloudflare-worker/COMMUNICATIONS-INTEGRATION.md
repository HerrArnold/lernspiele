# LernSafari – Nachrichten, Live-Aktivität und sichere automatische Freigabe

**Status: Quellcode im Entwicklungs-Branch vorbereitet und getestet; NICHT in den laufenden Cloudflare-Worker deployed.**

Der aktuell verwendete Cloudflare-Worker ist nicht als vollständiges Repository verfügbar. Diese
Dateien dürfen **nicht** als neuer eigenständiger Worker veröffentlicht oder blind über das
bestehende Skript kopiert werden. Sie erweitern die vorhandene autorisierte API nach
Integration in deren Authentisierungs- und Datenbankadapter.

## 1. Voraussetzungen

1. Sicherung des bestehenden Cloudflare-Worker-Codes und der D1-Datenbank.
2. Ein geschützter Test-Worker mit einer D1-Testdatenbank (keine Schülerdaten in öffentlichen Logs).
3. Vorhandene Session-Validatoren serverseitig zur Verfügung stellen:
   `existingRequireAdmin(request)` und `existingOptionalChild(request)`.
   Sie dürfen die Rolle niemals aus einem vom Browser mitgesendeten Feld übernehmen.
4. `studentExists(username)` muss die tatsächliche bestehende Schülerkontentabelle prüfen.
5. Die serverseitige Spiel-ID-Allowlist `SERVER_GAME_CATALOG` muss sämtliche freigegebenen
   Lernspiele enthalten, einschliesslich der neuen Hörverständnisse, soweit sie zugewiesen
   werden dürfen.

## 2. Datenbank

Nur auf der **Testkopie** der Datenbank nach Backup ausführen:

- `classroom-migration.sql`: vorhandene Classroom-Mode-Erweiterung
- `communications-migration.sql`: Nachrichten und kurzlebige Aktivität

Beide legen additive Tabellen an und ändern keine bestehenden Konten oder Aufgaben.

## 3. Worker-Anbindung

Die folgenden Bausteine müssen in den **bestehenden** Worker eingebaut werden:

```js
import {createCommunicationsService} from './communications-service.mjs';
import {createD1CommunicationsStore} from './communications-d1-store.mjs';

const communications = createCommunicationsService({
  auth: {
    requireAdmin: existingRequireAdmin,
    optionalChild: existingOptionalChild
  },
  store: {
    ...createD1CommunicationsStore(env.DB),
    studentExists: async username => existingStudentExists(username)
  },
  catalog: SERVER_GAME_CATALOG
});

const response = await communications.handle(request);
if (response) return addExistingCORSHeaders(response,request);
// Existing Worker handlers stay in place.
```

Die Classroom-Mode-Erweiterung wird zusätzlich wie in `INTEGRATION.md` beschrieben
eingehängt. Nur eine bewusst konfigurierte **serverseitige** Funktion
`trustedCompletionIds(username,{assignments,mode})` darf automatisch kontrollierte
Erledigungen an `createClassroomService` liefern. Diese Funktion muss eine
nachvollziehbare, vom Worker unabhängig geprüfte Bewertung verwenden (oder eine
Lehrpersonenprüfung). Von Kindern gesendete Punktzahlen, Häkchen oder ein
`correct:true`-Flag sind **keine** vertrauenswürdigen Freigaben.

Der Unterrichtsmodus kann bislang zuverlässig erst nach Lehrerbestätigung freischalten;
vollautomatische Freigabe wird erst nach Anschluss dieser Bewertungsquelle möglich.

## 4. Neue Endpunkte

| Route | Rolle | Funktion |
| --- | --- | --- |
| `POST /admin-messages` | verifizierte Lehrperson | Nachricht an die Klasse oder genau ein bestehendes Tierkonto |
| `GET /admin-messages` | verifizierte Lehrperson | kürzlich versendete Nachrichten (ohne Nachrichteninhalt) |
| `GET /messages` | angemeldetes Kind | nur Klassenmitteilungen und Nachrichten an das eigene Tierkonto |
| `POST /activity-heartbeat` | angemeldetes Kind | `{area,game}`, Namen ausschliesslich aus Session übernehmen |
| `GET /admin-live-activity` | verifizierte Lehrperson | nur Meldungen der letzten 120 Sekunden |

**Kein Tracking:** Keine IP-Adresse, kein Standort, keine Tastendrücke, keine Historie,
keine Antworten und keine Gerätekennung speichern. Die D1-Tabelle enthält nur
die zuletzt gemeldete Tätigkeit eines angemeldeten Tierkontos.
Sie kann beim Wartungslauf zusätzlich von alten Zeilen bereinigt werden.

## 5. Frontend-Status

In `Lernspiele2` ist bereits vorbereitet:

- Lehrpersonen-Nachrichtenformular mit Kind/Klasse-Auswahl;
  Senden wird erst bei bestätigter Antwort von `GET /admin-messages` aktiviert.
- Briefkasten für angemeldete Kinder aus `GET /messages`; ohne API bleibt die bisherige Ansicht.
- Lehrpersonen-Liveansicht aus `GET /admin-live-activity` mit manueller Aktualisierung.
- Sparsame Aktivitätsmeldungen in Lernspiele2 alle 45 Sekunden, nur bei einem
  sichtbaren, angemeldeten Kinderkonto.
- Bestehende `/admin-learning`, `/admin-assignments` und `/admin-report` bleiben unberührt.

## 6. Unbedingt prüfen, bevor Kinder diese Testversion verwenden

- Admin-Session abgelaufen / falscher Code: kein Versand, keine Live-Kinderanzeige.
- Kind A darf niemals private Nachrichten von Kind B sehen.
- Gast und abgemeldete Kinder senden keine Aktivität und lesen keine Nachrichten.
- In den letzten zwei Minuten aktive Konten werden angezeigt; danach nicht mehr.
- Unterrichtsmodus Ankunft und Fachunterricht für zwei verschiedene Kinder:
  noch nicht erledigt → kein Zugriff auf andere Bereiche;
  serverseitig geprüfte Erledigung → frei; neuer Pflichtauftrag → wieder eingeschränkt.
- Neue Spiele und Hörverständnisse in der trusted Spiel-ID-Allowlist.
- Cloudflare-CORS nur für erlaubte Seiten; niemals beliebige Origins spiegeln.
- Überprüfen, ob direkt aufrufbare öffentliche Spiel-HTML-Dateien weiterhin
  über Umwege erreichbar sind: eine reine Frontend-Sperre ersetzt keine
  serverseitige Zugangskontrolle für sensible Dateien.

## Veröffentlichung

Die Produktivseite `https://herrarnold.github.io/lernspiele/` bleibt unberührt.
Änderungen zuerst ausschliesslich auf dem Cloudflare-Testprojekt und mit Testkonten prüfen.
