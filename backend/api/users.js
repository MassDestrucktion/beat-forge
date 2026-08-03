import express from "express";
import { Router } from "express";
import requireBody from "../middleware/requireBody";

const usersRouter = Router();


usersRouter.post('/register', requireBody, async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const user = await createUser(username, pasword);

        const token = await createToken({id: user.id})
       res.status(201).send(token);
    }    
    catch {
        
    }
});

usersRouter.get('/login', requireBody, async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const user = await userLogin(username, password);

         if (!user) return res.status(401).send("Invalid username or password.");
    const token = await createToken({ id: user.id });
    res.send(token);
    }    
    catch(error) {
        console.log(error);
    }
});
