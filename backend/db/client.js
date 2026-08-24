import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_CONNECTION;

const db = new Pool({
  connectionString,
});

export default db;