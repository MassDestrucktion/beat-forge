/**
 * Projects API Router
 *
 * Endpoints:
 *   GET    /api/projects                   — list all public/shared projects
 *   POST   /api/projects                   — create a new project (auth required)
 *   GET    /api/projects/:id               — fetch a project by DB id (owner auth required)
 *   GET    /api/projects/shared/:sharedId  — fetch a project by shared_id (public, no auth)
 *   PUT    /api/projects/:id               — update a project (owner auth required)
 *   DELETE /api/projects/:id               — delete a project (owner auth required)
 *   POST   /api/projects/:id/fork          — fork a project into current user's library (auth required)
 *   POST   /api/projects/:id/share         — generate a shareable link (owner auth required)
 */

import express from "express";
import { randomUUID } from "crypto";
import {
  createProject,
  getProjectById,
  getProjectBySharedId,
  getProjectsByUser,
  getPublicProjects,
  updateProject,
  deleteProject,
} from "../db/queries/projects.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { getUser } from "../db/queries/users.js";

const router = express.Router();

/**
 * GET /api/projects
 * List all public/shared projects. No auth required.
 */
router.get("/", async (req, res, next) => {
  try {
    const projects = await getPublicProjects();
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 * Create a new project. Auth required — the project is owned by the caller.
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      description,
      tempo,
      grid,
      track_settings,
      arrangement,
      is_public,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const id = randomUUID();
    const sharedId = is_public ? randomUUID() : null;

    const project = await createProject({
      id,
      user_id: req.user.id,
      name: name.trim(),
      description,
      tempo: tempo || 120,
      grid,
      track_settings,
      arrangement,
      shared_id: sharedId,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 * Fetch a project by its database ID. Owner auth required.
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this project" });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/shared/:sharedId
 * Fetch a project by its shareable shared_id. No auth required.
 * Optionally include owner username if the caller is authenticated.
 */
router.get("/shared/:sharedId", optionalAuth, async (req, res, next) => {
  try {
    const project = await getProjectBySharedId(req.params.sharedId);

    if (!project) {
      return res.status(404).json({ error: "Shared project not found" });
    }

    // Optionally enrich with username
    if (req.user) {
      const owner = await getUser(project.user_id);
      project.username = owner?.username || null;
    } else if (project.user_id) {
      const owner = await getUser(project.user_id);
      project.username = owner?.username || null;
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/projects/:id
 * Update a project. Owner auth required.
 */
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this project" });
    }

    const {
      name,
      description,
      tempo,
      grid,
      track_settings,
      arrangement,
      shared_id,
    } = req.body;

    const updated = await updateProject(req.params.id, {
      name: name ?? null,
      description: description ?? null,
      tempo: tempo ?? null,
      grid: grid ?? null,
      track_settings: track_settings ?? null,
      arrangement: arrangement ?? null,
      shared_id: shared_id ?? null,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project. Owner auth required.
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this project" });
    }

    await deleteProject(req.params.id);

    res.json({ message: "Project deleted" });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/fork
 * Create a copy of a project (by shared_id or id) into the current user's library.
 * Auth required. The new project is fully owned by the calling user.
 */
router.post("/:id/fork", requireAuth, async (req, res, next) => {
  try {
    const source = await getProjectById(req.params.id);

    if (!source) {
      return res.status(404).json({ error: "Project not found" });
    }

    const newId = randomUUID();
    const newSharedId = null; // forks start private; user can share later

    const forked = await createProject({
      id: newId,
      user_id: req.user.id,
      name: `Copy of ${source.name}`,
      description: source.description,
      tempo: source.tempo,
      grid: source.grid,
      track_settings: source.track_settings,
      arrangement: source.arrangement,
      shared_id: newSharedId,
    });

    res.status(201).json(forked);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/share
 * Generate (or regenerate) a shareable link for a project.
 * Owner auth required.
 */
router.post("/:id/share", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const sharedId = project.shared_id || randomUUID();

    const updated = await updateProject(req.params.id, {
      name: null,
      description: null,
      tempo: null,
      grid: null,
      track_settings: null,
      arrangement: null,
      shared_id: sharedId,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
