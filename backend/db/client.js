import pg from "pg";

const connectionString = process.env.DATABASE_CONNECTION;
const useSSL = process.env.DATABASE_SSL === "true";

const db = new pg.Client({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

await db.connect();

export default db;