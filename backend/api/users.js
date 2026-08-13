import { Router } from "express";
import requireBody from "../middleware/requireBody.js";
import requireAuth from "../middleware/requireAuth.js";
import { createUser, userLogin, getUser } from "../db/queries/users.js";
import { createToken } from "../jwt/jwt.js";
import { get_user_projects } from "../db/queries/projects.js";
import { getFollowing, followUser, unfollowUser } from "../db/queries/users.js";
import authenticate from "../middleware/authenticate.js";


const usersRouter = Router();

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

usersRouter.post(
    "/login",
    requireBody(["username", "password"]),
    async (req, res, next) => {
        try {
            const { username, password } = req.body;

            console.log("LOGIN ATTEMPT:", username);

            const user = await userLogin(username, password);

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

usersRouter.get(
    "/:id/following",

    async (req, res, next) => {
        try {
            console.log("Route ID:", req.params.id);

            const following = await getFollowing(
                req.params.id
            );

            console.log("Sending:", following);

            res.json(following);
        } catch (error) {
            console.error("FOLLOWING ERROR:", error);
            next(error);
        }
    }
);

    

    usersRouter.delete("/:id/follow", async(req, res, next) => {
        const unfollow = await unfollowUser(req.user.id, req.params.id);
        res.send(unfollow);
        });

export default usersRouter;