-- Migration: Add step_notes JSONB column to projects table
-- Stores per-step note overrides for the sequencer grid.
-- Shape: array of arrays aligned with grid (null = inherit track note).
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/004_add_step_notes_column.sql

ALTER TABLE app.projects
    ADD COLUMN IF NOT EXISTS step_notes JSONB;