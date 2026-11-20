-- LernSafari Matheplan – Abhakstände für Tierkonten.
-- Optional: Wird im kombinierten Worker beim ersten Aufruf automatisch erstellt.
-- Vorhandene Schüler-, Aufgaben- und Spieldaten bleiben unverändert.
CREATE TABLE IF NOT EXISTS safari_math_plan_done (
  user_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, task_id)
);
