-- Migration: Add all sequencer JSONB columns to the public.projects table
-- The existing migrations 001-004 targeted the "app" schema, but the
-- actual projects table lives in the default "public" schema, so those
-- columns were never added. This adds them to the real table.
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/006_add_project_columns_public.sql

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS grid JSONB,
    ADD COLUMN IF NOT EXISTS track_settings JSONB,
    ADD COLUMN IF NOT EXISTS shared_id UUID UNIQUE,
    ADD COLUMN IF NOT EXISTS arrangement JSONB,
    ADD COLUMN IF NOT EXISTS track_order JSONB,
    ADD COLUMN IF NOT EXISTS step_notes JSONB;

-- Create index on shared_id for fast share-link lookups
CREATE INDEX IF NOT EXISTS idx_projects_shared_id ON projects(shared_id);