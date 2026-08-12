import pg from "pg";

const connectionString = process.env.DATABASE_CONNECTION || process.env.DATABASE_URL;
const shouldUseSSL =
    process.env.DATABASE_SSL === "true" ||
    (connectionString && /sslmode=require|azure\.com/i.test(connectionString));

const db = new pg.Client({
    connectionString,
    ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

await db.connect();

export default db;