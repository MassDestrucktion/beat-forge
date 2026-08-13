import { Router } from "express";
import usersRouter from "./users.js";
// import authRouter from "./auth.js";

const apiRouter = Router();

apiRouter.use("/users", usersRouter);
// router.use("/auth", authRouter);

export default apiRouter;