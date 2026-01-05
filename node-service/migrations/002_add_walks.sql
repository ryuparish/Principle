-- Migration: Add walks and walk_steps tables
-- Created: 2026-01-05

CREATE TABLE IF NOT EXISTS walks (
  id TEXT PRIMARY KEY,
  conceptMapId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conceptMapId) REFERENCES mindmaps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS walk_steps (
  id TEXT PRIMARY KEY,
  walkId TEXT NOT NULL,
  nodeId TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  annotation TEXT,
  zoomLevel REAL DEFAULT 1.5,
  duration INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (walkId) REFERENCES walks(id) ON DELETE CASCADE,
  FOREIGN KEY (nodeId) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_walks_conceptMapId ON walks(conceptMapId);
CREATE INDEX IF NOT EXISTS idx_walk_steps_walkId ON walk_steps(walkId);
CREATE INDEX IF NOT EXISTS idx_walk_steps_nodeId ON walk_steps(nodeId);
