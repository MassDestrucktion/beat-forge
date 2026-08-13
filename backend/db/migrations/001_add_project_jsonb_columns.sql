-- Migration: Add JSONB columns for grid, track_settings, and shared_id to projects table
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/001_add_project_jsonb_columns.sql

ALTER TABLE app.projects
    ADD COLUMN IF NOT EXISTS grid JSONB,
    ADD COLUMN IF NOT EXISTS track_settings JSONB,
    ADD COLUMN IF NOT EXISTS shared_id UUID UNIQUE,
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES app.users(id) ON DELETE SET NULL;

-- Create index on shared_id for fast share-link lookups
CREATE INDEX IF NOT EXISTS idx_projects_shared_id ON app.projects(shared_id);
