-- Migration: Add description column to projects table
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/003_add_description_to_projects.sql

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS description TEXT;