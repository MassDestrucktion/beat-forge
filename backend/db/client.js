import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_CONNECTION;

if (!connectionString) {
  throw new Error("DATABASE_CONNECTION environment variable is missing");
}

const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;