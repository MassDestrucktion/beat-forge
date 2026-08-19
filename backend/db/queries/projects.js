import db from "../client.js";

// Create a project
export async function createProject(
  id,
  user_id,
  name,
  tempo = 120,
  grid,
  track_settings,
  arrangement,
  track_order,
) {
  const SQL = `
        INSERT INTO  projects (
            id,
            user_id,
            name,
            tempo,
            grid,
            track_settings,
            arrangement,
            track_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;

  const {
    rows: [project],
  } = await db.query(SQL, [
    id,
    user_id,
    name,
    tempo,
    JSON.stringify(grid),
    JSON.stringify(track_settings),
    JSON.stringify(arrangement ?? []),
    track_order ? JSON.stringify(track_order) : null,
  ]);

  return project;
}

// Update a project
export async function updateProject(projectId, userId, name, tempo) {
  const SQL = `
        UPDATE projects
        SET
            name = $1,
            tempo = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND user_id = $4
        RETURNING *
    `;

  const {
    rows: [project],
  } = await db.query(SQL, [name, tempo, projectId, userId]);

  return project;
}

// Get all projects belonging to a user
export async function get_user_projects(user_id) {
  const SQL = `
        SELECT *
        FROM projects
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
        FROM projects
        WHERE id = $1
          AND user_id = $2
    `;

  const {
    rows: [project],
  } = await db.query(SQL, [projectId, userId]);

  return project;
}

export async function update_project_by_id(
  project_id,
  user_id,
  name,
  tempo,
  grid,
  track_settings,
  arrangement,
  track_order,
) {
  const SQL = `
    UPDATE projects
    SET
      name = $1,
      tempo = $2,
      grid = $3,
      track_settings = $4,
      arrangement = $5,
      track_order = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
      AND user_id = $8
    RETURNING *
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [
    name,
    tempo,
    JSON.stringify(grid),
    JSON.stringify(track_settings),
    JSON.stringify(arrangement ?? []),
    track_order ? JSON.stringify(track_order) : null,
    project_id,
    user_id,
  ]);

  return project;
}

// Delete a project belonging to a user
export async function delete_project(projectId, userId) {
  const SQL = `
        DELETE FROM projects
        WHERE id = $1
          AND user_id = $2
        RETURNING *
    `;

  const {
    rows: [project],
  } = await db.query(SQL, [projectId, userId]);

  return project;
}
