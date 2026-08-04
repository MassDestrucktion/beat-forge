import pg from "pg";

const db = pg.Client(process.env.DATABASE_CONNECTION);

export default db;