-- Zusatzmigration: nur nach Backup und vorhandener communications-migration.sql ausführen.
-- Bestehende Briefe bleiben erhalten und werden als normale Nachricht eingeordnet.
ALTER TABLE safari_teacher_messages
 ADD COLUMN kind TEXT NOT NULL DEFAULT 'message'
 CHECK(kind IN ('message','update','success'));

CREATE TABLE IF NOT EXISTS safari_message_reads (
 message_id INTEGER NOT NULL,
 username TEXT NOT NULL,
 read_at TEXT NOT NULL,
 PRIMARY KEY(message_id,username),
 FOREIGN KEY(message_id) REFERENCES safari_teacher_messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_safari_message_reads_user ON safari_message_reads(username,read_at);
