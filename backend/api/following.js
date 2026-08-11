import express from "express";
const router = express.router();
export default router;

import getFollowing from "../db/queries/following";

router.get("/following", async(req, res, next) => {
    const following = await getFollowing();
    res.send(following);
});