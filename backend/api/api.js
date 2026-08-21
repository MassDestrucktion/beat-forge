import { Router } from "express";
import usersRouter from "./users.js";

const apiRouter = Router();

apiRouter.use("/users", usersRouter);

export default apiRouter;