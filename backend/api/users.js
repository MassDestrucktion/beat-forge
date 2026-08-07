import { Router } from "express";
import requireBody from "../middleware/requireBody.js";
import { createUser, userLogin, getUser } from "../db/queries/users.js";
import { createToken } from "../jwt/jwt.js";

const usersRouter = Router();



usersRouter.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await getUser(id);

        res.send(user);

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


            const user = await createUser(
                username,
                password
            );


            if (!user) {
                return res
                    .status(404)
                    .send("Incorrect Credentials");
            }


            const token = await createToken({
                id: user.id
            });


            // Remove password before sending user data
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


            const user = await userLogin(
                username,
                password
            );


            if (!user) {
                return res
                    .status(401)
                    .send("Invalid username or password.");
            }


            const token = await createToken({
                id: user.id
            });


            // Remove password before sending user data
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



export default usersRouter;