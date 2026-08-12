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



export async function getUser(id) {
    const SQL = `
        SELECT *
        FROM app.users
        WHERE id = $1
    `;


    const { rows: [user] } = await db.query(SQL, [
        id
    ]);


    return user;
}

export async function getFollowing(id) {
    const SQL =`
        SELECT u.id, u.username, u.display_name, u.avatar_url
FROM follows f
JOIN users u ON u.id = f.followee_id
WHERE f.follower_id = 123
ORDER BY f.created_at DESC;  
    `;

    const { rows: followings } = await db.query(SQL, [id]);
    return followings;
};

export async function followUser(followerId, followingId) {
    const SQL = `  
        INSERT INTO follows (follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING *
    `;
    const { rows: followings } = await db.query(SQL, [followerId, followingId]);
    return followings;
};

export async function unfollowUser(followerId, followingId) {
    const SQL = `
        DELETE FROM follows
        WHERE follower_id = $1 AND following_id = $2
        RETURNING *
    `;
    const { rows: followings } = await db.query(SQL, [followerId, followingId]);
    return followings;
}

export async function followCounts(followerId, followingId) {
    const SQL = `
    -- Ad hoc (fine at moderate scale)
    SELECT
    (SELECT COUNT(*) FROM follows WHERE followee_id = 123) AS followers,
    (SELECT COUNT(*) FROM follows WHERE follower_id = 123) AS following;
    `;

    const { rows: followings } = await db.query(SQL, [followerId, followingId]);
    return followings;
};