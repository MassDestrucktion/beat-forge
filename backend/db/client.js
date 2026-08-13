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

const info = await db.query(`
    SELECT
        current_database(),
        current_schema(),
        current_user
`);

console.log("DATABASE INFO:", info.rows);

const tables = await db.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name = 'follows'
`);

console.log("FOLLOWS TABLE:", tables.rows);

export default db;