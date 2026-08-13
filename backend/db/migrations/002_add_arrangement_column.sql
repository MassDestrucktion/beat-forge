-- Migration: Add arrangement JSONB column to projects table
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/002_add_arrangement_column.sql

ALTER TABLE app.projects
    ADD COLUMN IF NOT EXISTS arrangement JSONB;