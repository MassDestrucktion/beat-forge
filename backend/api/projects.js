import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { getRecentProjects } from "../db/queries/projects.js";

const projectsRouter = Router();

// Recent projects feed for the Discover page (public)
projectsRouter.get("/recent", async (req, res, next) => {
  try {
    const parsed = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 50)
      : 12;

    const projects = await getRecentProjects(limit);

    res.json(projects);
  } catch (error) {
    console.error("RECENT PROJECTS ERROR:", error);
    next(error);
  }
});

// Generate a share link for a project (sets shared_id if missing)
projectsRouter.post(
  "/:projectId/share",
  requireAuth,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Ensure the project belongs to the authenticated user
      const {
        rows: [project],
      } = await db.query(
        `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
        [projectId, userId],
      );

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // If no shared_id yet, generate one
      if (!project.shared_id) {
        const sharedId = randomUUID();

        const {
          rows: [updated],
        } = await db.query(
          `UPDATE projects SET shared_id = $1 WHERE id = $2 RETURNING *`,
          [sharedId, projectId],
        );

        return res.json(updated);
      }

      res.json(project);
    } catch (error) {
      console.error("SHARE ERROR:", error);
      next(error);
    }
  },
);

// Load a shared project by its shared_id (public, no auth required)
projectsRouter.get("/shared/:sharedId", async (req, res, next) => {
  try {
    const { sharedId } = req.params;

    const {
      rows: [project],
    } = await db.query(
      `SELECT p.*, u.username
       FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.shared_id = $1`,
      [sharedId],
    );

    if (!project) {
      return res.status(404).json({
        message: "Shared project not found",
      });
    }

    res.json(project);
  } catch (error) {
    console.error("SHARED LOAD ERROR:", error);
    next(error);
  }
});

export default projectsRouter;
