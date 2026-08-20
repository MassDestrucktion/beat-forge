-- Migration: Add track_order JSONB column to projects table
-- Stores the display order of arrangement track lanes (array of track indices).
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/003_add_track_order_column.sql

ALTER TABLE app.projects
    ADD COLUMN IF NOT EXISTS track_order JSONB;
