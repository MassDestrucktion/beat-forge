import crypto from "crypto";
import { Router } from "express";
import requireBody from "../middleware/requireBody.js";
import { createToken } from "../jwt/jwt.js";
import db from "../db/index.js";

import {
  createUser,
  userLogin,
  getUser,
  getFollowing,
  unfollowUser,
  followUser,
  searchUsers,
  checkFollowing
} from "../db/queries/users.js";

import {
  createProject,
  get_user_projects,
  get_project_by_id,
  update_project_by_id,
  delete_project,
} from "../db/queries/projects.js";
import { requireAuth } from "../middleware/auth.js";
const usersRouter = Router();


usersRouter.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;

    const users = await searchUsers(q);

    res.send(users);
  } catch (error) {
    next(error);
  }
});

// Get user by id
usersRouter.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await getUser(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);

    } catch (error) {
        console.log(error);
        next(error);
    }
});




// Get user's projects
usersRouter.get("/:id/projects", async (req, res, next) => {
    try {
        const { id } = req.params;

        const projects = await get_user_projects(id);

        res.json(projects);

    } catch (error) {
        console.log(error);
        next(error);
    }
});

usersRouter.post(
  "/:id/projects",
  requireBody([
    "name",
    "tempo",
    "grid",
    "track_settings",
    "arrangement",
  ]),
  async (req, res, next) => {
    try {
      const { id: user_id } = req.params;
      console.log('user_id from params:', user_id);

      const user = await getUser(user_id);
      console.log('user from getUser:', user);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const {
        name,
        tempo,
        grid,
        track_settings,
        arrangement,
      } = req.body;

      const project = await createProject(
        crypto.randomUUID(),
        user_id,
        name,
        tempo,
        grid,
        track_settings
      );

      res.status(201).json(project);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
);


usersRouter.get("/:id/projects/:projectId", async (req, res, next) => {
  try {
    const { id: user_id, projectId: project_id } = req.params;

    const project = await get_project_by_id(project_id, user_id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(project);
  } catch (error) {
    console.log(error);
    next(error);
  }
});


// Register
usersRouter.post(
    "/register",
    requireBody(["username", "password"]),
    async (req, res, next) => {
        try {
            const { username, password } = req.body;

            const user = await createUser(username, password);

            if (!user) {
                return res.status(400).json({
                    message: "Unable to create user"
                });
            }

            const token = await createToken({
                id: user.id
            });

            const { password: _, ...safeUser } = user;

            res.status(201).json({
                user: safeUser,
                token
            });

        } catch (error) {
            console.log(error);
            next(error);
        }
    }
);

usersRouter.put(
  "/:id/projects/:projectId",
  requireBody([
    "name",
    "tempo",
    "grid",
    "track_settings",
    "arrangement",
  ]),
  async (req, res, next) => {
    try {
      const { id: user_id, projectId: project_id } = req.params;
      console.log('user_id from params:', user_id);

      const existingProject = await get_project_by_id(
        project_id,
        user_id,
      );
      console.log('existingProject from get_project_by_id:', existingProject);

      if (!existingProject) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const {
        name,
        tempo,
        grid,
        track_settings,
        arrangement,
      } = req.body;

      const project = await update_project_by_id(
        project_id,
        user_id,
        name,
        tempo,
        grid,
        track_settings
      );

      res.json(project);
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
);


usersRouter.delete("/:id/projects/:projectId", async (req, res, next) => {
  try {
    const { id: user_id, projectId: project_id } = req.params;

    const deletedProject = await delete_project(project_id, user_id);

    if (!deletedProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(deletedProject);
  } catch (error) {
    console.log(error);
    next(error);
  }
});


// Login
usersRouter.post(
    "/login",
    requireBody(["username", "password"]),
    async (req, res, next) => {
        try {
            const { username, password } = req.body;

            console.log("LOGIN ATTEMPT:", username);

            const user = await userLogin(
                username,
                password
            );

            console.log("USER FOUND:", user);

            if (!user) {
                return res.status(401).json({
                    message: "Invalid username or password."
                });
            }

            const token = await createToken({
                id: user.id
            });

            const { password: _, ...safeUser } = user;

            res.json({
                user: safeUser,
                token
            });

        } catch (error) {
            console.log(error);
            next(error);
        }
    }
);

// Get follow

usersRouter.get("/:id/following", async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const following = await getFollowing(id);

        if (!following) {
            return res.status(404).json({
                message: "Followers not found"
            });
        }
        console.log(following)
        res.json(following);

    } catch (error) {
        console.log(error);
        next(error);
    }
});

usersRouter.post("/:id/follow", requireAuth, async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followeeId = req.params.id;

        if (followerId === followeeId) {
            return res.status(400).json({
                message: "You cannot follow yourself",
            });
        }

        const follow = await followUser(
            followerId,
            followeeId
        );

        res.status(201).json(follow);

    } catch (error) {
        console.error("FOLLOW ERROR:", error);
        next(error);
    }
});

usersRouter.delete("/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const followeeId = req.params.id;

    const result = await unfollowUser(followerId, followeeId);

    res.send(result);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id/follow-status", requireAuth, async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const followeeId = req.params.id;

    const isFollowing = await checkFollowing(
      followerId,
      followeeId
    );

    res.json({ isFollowing });
  } catch (error) {
    console.error("FOLLOW STATUS ERROR:", error);
    next(error);
  }
});

//ProfilePic
usersRouter.put("/:id/profile-picture", requireAuth, async (req, res, next) => {
  try {
    const { profile_pic } = req.body;

    const result = await db.query(
      `
      UPDATE app.users
      SET profile_pic = $1
      WHERE id = $2
      RETURNING id, username, profile_pic
      `,
      [profile_pic, req.params.id]
    );

    res.send(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


export default usersRouter;