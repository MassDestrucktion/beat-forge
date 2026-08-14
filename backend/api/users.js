import { Router } from "express";
import requireBody from "../middleware/requireBody.js";
import {
    createUser,
    userLogin,
    getUser,
} from "../db/queries/users.js";
import { createToken } from "../jwt/jwt.js";
import { get_user_projects } from "../db/queries/projects.js";

const usersRouter = Router();


// Get user by id
usersRouter.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await getUser(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Never return the password
        const { password: _, ...safeUser } = user;

        res.json(safeUser);
    } catch (error) {
        console.log(error);
        next(error);
    }
});


// Get user's projects
usersRouter.get("/:id/projects", async (req, res, next) => {
    try {
        const { id } = req.params;

        // Make sure the user exists
        const user = await getUser(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const projects = await get_user_projects(id);

        res.json(projects);
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
                    message: "Unable to create user",
                });
            }

            const token = await createToken({
                id: user.id,
            });

            const { password: _, ...safeUser } = user;

            res.status(201).json({
                user: safeUser,
                token,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
);


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
                    message: "Invalid username or password.",
                });
            }

            const token = await createToken({
                id: user.id,
            });

            const { password: _, ...safeUser } = user;

            res.json({
                user: safeUser,
                token,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
);


export default usersRouter;