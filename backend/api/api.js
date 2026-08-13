import { Router } from "express";
import usersRouter from "./users.js";
import projectsRouter from "./projects.js";

const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/projects", projectsRouter);

export default apiRouter;
