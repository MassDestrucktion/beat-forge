
import pg from "pg";

const db = new pg.Client({
  connectionString: process.env.DATABASE_CONNECTION,
    ssl: {
    rejectUnauthorized: false
  }
});

await db.connect();

export default db;
