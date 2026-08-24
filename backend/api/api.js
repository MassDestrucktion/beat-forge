import { Router } from "express";
import usersRouter from "./users.js";
import projectsRouter from "./projects.js";
// import authRouter from "./auth.js";

const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/projects", projectsRouter);
// router.use("/auth", authRouter);

export default apiRouter;
