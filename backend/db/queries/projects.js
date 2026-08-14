import db from "../client.js";

// Create a project
export async function createProject(
    id,
    user_id,
    name,
    tempo = 120,
    description = null
) {
    const SQL = `
        INSERT INTO app.projects (
            id,
            user_id,
            name,
            description,
            tempo
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    const {
        rows: [project],
    } = await db.query(SQL, [
        id,
        user_id,
        name,
        description,
        tempo,
    ]);

    return project;
}


// Update a project
export async function updateProject(
    projectId,
    userId,
    name,
    tempo,
    description = null
) {
    const SQL = `
        UPDATE app.projects
        SET
            name = $1,
            tempo = $2,
            description = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND user_id = $5
        RETURNING *
    `;

    const {
        rows: [project],
    } = await db.query(SQL, [
        name,
        tempo,
        description,
        projectId,
        userId,
    ]);

    return project;
}


// Get all projects belonging to a user
export async function get_user_projects(user_id) {
    const SQL = `
        SELECT *
        FROM app.projects
        WHERE user_id = $1
        ORDER BY updated_at DESC
    `;

    const { rows } = await db.query(SQL, [user_id]);

    return rows;
}


// Get a single project belonging to a user
export async function get_project_by_id(projectId, userId) {
    const SQL = `
        SELECT *
        FROM app.projects
        WHERE id = $1
          AND user_id = $2
    `;

    const {
        rows: [project],
    } = await db.query(SQL, [
        projectId,
        userId,
    ]);

    return project;
}


// Delete a project belonging to a user
export async function delete_project(projectId, userId) {
    const SQL = `
        DELETE FROM app.projects
        WHERE id = $1
          AND user_id = $2
        RETURNING *
    `;

    const {
        rows: [project],
    } = await db.query(SQL, [
        projectId,
        userId,
    ]);

    return project;
}