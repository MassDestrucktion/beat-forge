import express from "express";
const router = express.router();
export default router;

import { getTracks, getTracksById } from "../db/queries/tracks";

router.get("/tracks", async(req, res, next) => {
    const tracks = await getTracks();
    res.send(tracks);
});
router.post("/tracks")

router.get("/id", async(req, res, next) => {
    const track = await getTracksById(req.parms.id);
    if (!track) return res.status(404).send("Track not found.");
  res.send(track);
});