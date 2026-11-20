-- LernSafari: sparsame Besuchserfassung für Lern-Lagune, Oase und Baobab.
-- Reine Schema-Erweiterung; bestehende Schüler-, Spiel- und Matheplan-Daten bleiben unverändert.
-- Dieselbe Tabelle wird im kombinierten Cloudflare-Worker automatisch angelegt.
CREATE TABLE IF NOT EXISTS safari_learning_visits (
  user_id INTEGER NOT NULL,
  area TEXT NOT NULL,
  content TEXT NOT NULL,
  opens INTEGER NOT NULL DEFAULT 0,
  first_at TEXT NOT NULL,
  last_at TEXT NOT NULL,
  PRIMARY KEY (user_id,area,content)
);

-- Für die historischen vollständigen Durchläufe werden die bereits
-- gespeicherten game_attempts verwendet. Es wird nichts umgeschrieben.
-- Absichtlich KEIN automatischer Vollscan oder täglicher Cron-Auftrag.
