import pg from "pg";

const { Pool } = pg;

// Prefer DATABASE_URL (cloud deployments) but fall back to
// DATABASE_CONNECTION for local development compatibility.
const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_CONNECTION;

// Only use SSL for remote/cloud databases (e.g. Neon, Supabase, Azure).
// Local PostgreSQL (localhost/127.0.0.1) does not support SSL.
const isLocal = /localhost|127\.0\.0\.1|::1/.test(connectionString || "");

// DATABASE_SSL explicitly controls SSL; otherwise auto-detect.
const sslFlag = process.env.DATABASE_SSL;
const useSsl =
  sslFlag === "true" ? true : sslFlag === "false" ? false : !isLocal;

const db = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export default db;
