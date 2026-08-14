
import pg from "pg";

const db = new pg.Client({
  connectionString: process.env.DATABASE_CONNECTION,
});

await db.connect();

export default db;
