import db from "../client.js";
import { randomUUID } from "crypto";

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
  step_notes,
  is_public = false,
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
            track_order,
            step_notes,
            is_public
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    step_notes ? JSON.stringify(step_notes) : null,
    is_public,
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

// Get all projects belonging to a user.
//
// publicOnly=true restricts the list to PUBLIC projects — used when
// someone other than the owner requests the profile's projects, so
// private beats never leave the owner's account.
export async function get_user_projects(user_id, publicOnly = false) {
  const SQL = `
        SELECT *
        FROM projects
        WHERE user_id = $1
        ${publicOnly ? "AND is_public = TRUE" : ""}
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

// Get any single project by id regardless of owner. Used for visibility
// checks (e.g. forking) where the source's owner may not be the caller.
export async function get_project_any_owner(projectId) {
  const SQL = `
        SELECT *
        FROM projects
        WHERE id = $1
    `;

  const {
    rows: [project],
  } = await db.query(SQL, [projectId]);

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
  step_notes,
  is_public = false,
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
      step_notes = $7,
      is_public = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
      AND user_id = $10
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
    step_notes ? JSON.stringify(step_notes) : null,
    is_public,
    project_id,
    user_id,
  ]);

  return project;
}

// Update a project's visibility only (publish/unpublish). Only the owner
// can change visibility, enforced by the user_id in the WHERE clause.
export async function update_project_visibility(
  project_id,
  user_id,
  is_public,
) {
  const SQL = `
    UPDATE projects
    SET is_public = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND user_id = $3
    RETURNING *
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [is_public, project_id, user_id]);

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

// Get the most recently created PUBLIC projects with owner info (Discover feed)
export async function getRecentProjects(limit = 12) {
  const SQL = `
        SELECT
            p.id,
            p.name,
            p.tempo,
            p.created_at,
            u.id AS user_id,
            u.username,
            u.picurl
        FROM projects p
        JOIN users u ON u.id = p.user_id
        WHERE p.is_public = TRUE
        ORDER BY p.created_at DESC
        LIMIT $1
    `;

  const { rows } = await db.query(SQL, [limit]);

  return rows;
}

// Fork a project — copy all data to a new project owned by newUserId,
// linking back to the original via shared_id. The ROUTE enforces that only
// public projects can be forked by other users (owners can fork their own).
// The copy always starts PRIVATE — the new owner publishes it themselves.
export async function forkProject(projectId, newUserId) {
  const newId = randomUUID();

  const SQL = `
    INSERT INTO projects (
      id,
      user_id,
      name,
      tempo,
      grid,
      track_settings,
      arrangement,
      track_order,
      step_notes,
      shared_id,
      is_public
    )
    SELECT
      $1,
      $2,
      name || ' (fork)',
      tempo,
      grid,
      track_settings,
      arrangement,
      track_order,
      step_notes,
      id,
      FALSE -- forks always start PRIVATE; the new owner publishes them
    FROM projects
    WHERE id = $3
    RETURNING *
  `;

  const {
    rows: [project],
  } = await db.query(SQL, [newId, newUserId, projectId]);

  return project;
}
