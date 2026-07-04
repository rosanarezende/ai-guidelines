-- SQLite read-model example. Derived only; not an authoritative SSOT.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projection_metadata (
  content_hash TEXT PRIMARY KEY,
  schema TEXT NOT NULL,
  node_count INTEGER NOT NULL,
  edge_count INTEGER NOT NULL,
  issue_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  data_json TEXT NOT NULL,
  data_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT NOT NULL,
  FOREIGN KEY(source) REFERENCES nodes(id),
  FOREIGN KEY(target) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  rule TEXT NOT NULL,
  node TEXT NOT NULL,
  msg TEXT NOT NULL
);
