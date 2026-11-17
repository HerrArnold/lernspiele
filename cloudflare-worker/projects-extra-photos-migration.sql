-- Zusatzmigration für mehrere Fotos je Erlebnis. Vorher die D1-Datenbank sichern.
-- Voraussetzung: cloudflare-worker/projects-migration.sql wurde ausgeführt.
-- Bestehende Polaroids und ihr Titelbild bleiben vollständig erhalten.
CREATE TABLE IF NOT EXISTS safari_project_photos (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 project_id INTEGER NOT NULL REFERENCES safari_projects(id) ON DELETE CASCADE,
 image_data TEXT NOT NULL,
 position INTEGER NOT NULL DEFAULT 1,
 published_by TEXT NOT NULL,
 published_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_safari_project_photos_order
 ON safari_project_photos(project_id,position,id);
