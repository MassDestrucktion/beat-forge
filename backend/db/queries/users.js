import db from "../client.js";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export async function createUser(username, password) {
    const SQL = `
        INSERT INTO app.users (id, username, password)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    try {
        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 12);

        const id = randomUUID();

        console.log("Password hashed. Running database query...");
        console.log("Database:", process.env.DATABASE_CONNECTION);

        const { rows: [user] } = await db.query(SQL, [
            id,
            username,
            hashedPassword
        ]);

        console.log("Database query complete:", user);

        return user;
    } catch (error) {
        console.error("createUser failed:", error);
        throw error;
    }
}

export async function userLogin(username, password) {
    const SQL = `
    SELECT * 
    FROM app.users 
    WHERE username = $1 
    `;
    const {rows: [user]} = await db.query(SQL, [username]);
    const authenticate = await bcrypt.compare(password, user.password);

    if (authenticate) {
        return user;
    }
    return null;
};

export async function getUser(id) {
const SQL = `
    SELECT *
    FROM users
    WHERE id = $1
    RETURNING *
    `;
const {rows: [user]} = await db.query(SQL, [id]);
return user;
};