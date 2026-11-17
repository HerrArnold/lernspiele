-- LernSafari D1: NUR LESEN, keine Daten veraendern.
-- Cloudflare D1 Console: Die folgende Abfrage zeigt nur Schema-Metadaten.
-- Es werden KEINE Schuelerdaten ausgegeben und KEINE Tabellen angelegt/geaendert.
SELECT
  name AS tabellenname,
  CASE name
    WHEN 'safari_projects' THEN 'Baobab-Polaroids: Basistabelle'
    WHEN 'safari_project_photos' THEN 'Baobab-Polaroids: Zusatzfotos'
    ELSE 'Weitere bestehende Tabelle'
  END AS bedeutung
FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;

-- Hinweis: Hiermit pruefen wir nur die Tabellenliste.
-- Ein aktuelles, dauerhaftes Backup ist damit NICHT erstellt.
-- Keine Migration vor dem separaten Backup anwenden.
