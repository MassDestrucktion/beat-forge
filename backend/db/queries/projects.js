import db from "../client.js";

/**
 * Create a new project in the database.
 */
export async function createProject({
  id,
  user_id,
  name,
  description,
  tempo,
  grid,
  track_settings,
  arrangement,
  shared_id,
}) {
  const SQL = `
    INSERT INTO app.projects
      (id, user_id, name, description, tempo, grid, track_settings, arrangement, shared_id)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [
    id,
    user_id,
    name,
    description || null,
    tempo || 120,
    grid || null,
    track_settings || null,
    arrangement || null,
    shared_id || null,
  ]);

  return project;
}

/**
 * Fetch a project by its primary UUID id.
 * Used for editing — requires the caller to be the owner.
 */
export async function getProjectById(id) {
  const SQL = `
    SELECT
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
    FROM app.projects
    WHERE id = $1
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [id]);
  return project;
}

/**
 * Fetch a project by its shared_id.
 * This is the public / share-link lookup — no auth required.
 */
export async function getProjectBySharedId(sharedId) {
  const SQL = `
    SELECT
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
    FROM app.projects
    WHERE shared_id = $1
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [sharedId]);
  return project;
}

/**
 * Update an existing project.
 * Only the owner can update; caller should verify ownership.
 */
export async function updateProject(
  id,
  { name, description, tempo, grid, track_settings, arrangement, shared_id },
) {
  const SQL = `
    UPDATE app.projects
    SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      tempo = COALESCE($4, tempo),
      grid = COALESCE($5, grid),
      track_settings = COALESCE($6, track_settings),
      arrangement = COALESCE($7, arrangement),
      shared_id = COALESCE($8, shared_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [
    id,
    name,
    description,
    tempo,
    grid,
    track_settings,
    arrangement,
    shared_id,
  ]);

  return project;
}

/**
 * List all projects owned by a specific user.
 */
export async function getProjectsByUser(userId) {
  const SQL = `
    SELECT
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
    FROM app.projects
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const { rows: projects } = await db.query(SQL, [userId]);
  return projects;
}

/**
 * List all public / shared projects (shared_id is not null).
 */
export async function getPublicProjects() {
  const SQL = `
    SELECT
      id, user_id, name, description, tempo, grid, track_settings, arrangement,
      shared_id, created_at, updated_at
    FROM app.projects
    WHERE shared_id IS NOT NULL
    ORDER BY created_at DESC
  `;

  const { rows: projects } = await db.query(SQL, []);
  return projects;
}

/**
 * Delete a project. Only the owner may delete.
 */
export async function deleteProject(id) {
  const SQL = `
    DELETE FROM app.projects
    WHERE id = $1
  `;

  await db.query(SQL, [id]);
}
