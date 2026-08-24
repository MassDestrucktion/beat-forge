-- Migration: Add picurl column to users table
-- The app references users.picurl (profile picture URL) but the
-- base schema.sql only defines id, username, password, bio.
-- Run this against an existing database:
--   psql $DATABASE_CONNECTION -f db/migrations/005_add_picurl_column.sql

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS picurl TEXT;