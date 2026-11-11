-- LernSafari – additional tables only (no existing tables changed).
-- Apply to the SAME D1 database used by the existing Cloudflare Worker,
-- after backup and inspection of its current schema.
CREATE TABLE IF NOT EXISTS safari_classroom_mode (
  scope TEXT PRIMARY KEY CHECK (scope = 'class'),
  kind TEXT NOT NULL CHECK (kind IN ('arrival','subject','free','closed')),
  subject TEXT,
  required_assignment_ids_json TEXT NOT NULL DEFAULT '[]',
  expires_at TEXT NOT NULL,
  modified_by TEXT NOT NULL,
  modified_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS safari_assignment_verification (
  username TEXT NOT NULL,
  assignment_id INTEGER NOT NULL,
  verified_at TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  PRIMARY KEY (username, assignment_id)
);
CREATE TABLE IF NOT EXISTS safari_assignment_verification_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  assignment_id INTEGER NOT NULL,
  verified INTEGER NOT NULL CHECK (verified IN (0,1)),
  actor TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_safari_verification_assignment ON safari_assignment_verification(assignment_id);
