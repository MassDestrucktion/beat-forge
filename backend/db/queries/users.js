import db from "#db/client";
import bcrypt from "bcrypt";

export async function createUser(username, password) {
    const SQL = `
    INSERT INTO users (username, password)
    VALUES ($1, $2)
    returning*
    `;

    const hashedPassword = await bcrypt.hash(password, 12);
    const{ rows: [user],} = await db.query(SQL, [username, hashedPassword]);
    
    return user;
};

export async function userLogin(username, pasword) {
    const SQL = `
    SELECT * 
    FROM users 
    WHERE username = $1  
    `;
    const {rows: [user]} = await db.query(SQL, [username]);
    const authenticate = await bcrypt.compare(password, user.password);

    return user;
};