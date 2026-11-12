-- Additional LernSafari test-database tables for authenticated messages and
-- short-lived child activity. Apply only after D1 backup and Worker integration.
CREATE TABLE IF NOT EXISTS safari_teacher_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT NOT NULL CHECK (audience IN ('all','child')),
  recipient TEXT,
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1500),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_safari_messages_recipient
  ON safari_teacher_messages(audience,recipient,created_at);

-- Only last reported activity, no historical timeline or page-click trail.
CREATE TABLE IF NOT EXISTS safari_live_activity (
  username TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  game TEXT,
  last_seen TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_safari_live_activity_recent
  ON safari_live_activity(last_seen);
