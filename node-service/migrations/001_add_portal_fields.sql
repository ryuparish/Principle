-- Migration: Add portal node support
-- Date: 2026-01-03
-- Description: Adds fields to support cross-map portal nodes

-- Add node_type column (default 'regular')
ALTER TABLE nodes ADD COLUMN node_type TEXT DEFAULT 'regular';

-- Add portal target fields
ALTER TABLE nodes ADD COLUMN portal_target_map_id TEXT;
ALTER TABLE nodes ADD COLUMN portal_target_node_id TEXT;

-- Add portal source fields (for bidirectional tracking)
ALTER TABLE nodes ADD COLUMN portal_source_map_id TEXT;
ALTER TABLE nodes ADD COLUMN portal_source_node_id TEXT;

-- Note: SQLite doesn't support adding foreign key constraints via ALTER TABLE
-- If foreign key constraints are needed, they should be added when creating the table
-- or by recreating the table with the new schema
