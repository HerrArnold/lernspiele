-- Baobab published class experiences: test D1 only after backup.
-- An entry is visible to guests once an authorized teacher publishes it.
CREATE TABLE IF NOT EXISTS safari_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  image_data TEXT NOT NULL,
  published_at TEXT NOT NULL,
  published_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_safari_projects_event_date ON safari_projects(event_date DESC,id DESC);
