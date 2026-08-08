import db from "../client.js";

export async function createProject(id, user_id, name, description) {
    const SQL = `
        INSERT INTO app.projects (id, user_id, name, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    const { rows: [project] } = await db.query(SQL, [
        id,
        user_id,
        name,
        description
    ]);

    return project;
}


export async function get_user_projects(user_id) {
    const SQL = `
        SELECT *
        FROM app.projects
        WHERE user_id = $1
    `;

    const { rows } = await db.query(SQL, [
        user_id
    ]);

    return rows;
}