import db from "../client.js";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";


export async function createUser(username, password) {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
        throw new Error("Username already taken");
    }

    const SQL = `
        INSERT INTO  users (id, username, password)
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
        FROM users
        WHERE username = $1
    `;


    const { rows: [user] } = await db.query(SQL, [
        username
    ]);


    if (!user) {
        return null;
    }


    const authenticate = await bcrypt.compare(
        password,
        user.password
    );


    if (authenticate) {
        return user;
    }


    return null;
}

export async function findUserByUsername(username) {
    const SQL = `
        SELECT *
        FROM users
        WHERE username = $1
    `;

    const { rows: [user] } = await db.query(SQL, [username]);
    return user;
}



export async function getUser(id) {
    const SQL = `
        SELECT *
        FROM users
        WHERE id = $1
    `;


    const { rows: [user] } = await db.query(SQL, [
        id
    ]);


    return user;
}

//Followers

export async function getFollowing (id) {
    const SQL = `
        SELECT u.id, u.username
        FROM follows f
        JOIN users u ON u.id = f.followee_id
        WHERE f.follower_id = $1 
    `;
    const response = await db.query(SQL, [id])

    return response.rows
};