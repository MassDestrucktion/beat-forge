import express from "express";
import { Router } from "express";
import requireBody from "../middleware/requireBody.js";
import { createUser } from "../db/queries/users.js";
import { userLogin } from "../db/queries/users.js";

const usersRouter = Router();



usersRouter.get('/', async (req, res, next) => {
    res.send("here!");
});


usersRouter.post(
  '/register',
  requireBody(["username", "password"]),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await createUser(username, password);

      res.status(201).send(user);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

usersRouter.post('/login', requireBody(["username", "password"]), async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const user = await userLogin(username, password);

         if (!user) return res.status(401).send("Invalid username or password.");
    //const token = await createToken({ id: user.id });
    res.send(user);
    }    
    catch(error) {
        console.log(error);
        next(error);
    }
});

export default usersRouter;
