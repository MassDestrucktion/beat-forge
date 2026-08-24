// backend/scripts/runMigrations.js
//
// Runs every SQL file in db/migrations/ in alphabetical order against the
// configured DATABASE_URL. Safe to run on every container start — each
// migration uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it is
// idempotent.
//
// Usage: node backend/scripts/runMigrations.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import db from "../db/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, "../db/migrations");

async function runMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`[migrate] Found ${files.length} migration(s).`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    console.log(`[migrate] Running ${file}...`);

    try {
      await db.query(sql);

      console.log(`[migrate] ✅ ${file}`);
    } catch (error) {
      console.error(`[migrate] ❌ ${file} failed:`, error.message);

      throw error;
    }
  }

  console.log("[migrate] All migrations complete.");

  await db.end();
}

runMigrations().catch((error) => {
  console.error("[migrate] Migration failed:", error);

  process.exit(1);
});
