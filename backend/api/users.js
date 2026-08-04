import express from "express";
import { Router } from "express";
import requireBody from "../middleware/requireBody";

const usersRouter = Router();

usersRouter.post('/register', requireBody, async (req, res, next) => {
    try {
        const user = req.body;

        res.send(await create_user(user));
    }    
    catch {
        
    }
});
