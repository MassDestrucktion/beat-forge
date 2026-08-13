import express from "express";
const router = express.Router();
export default router;

import { getTracks, getTracksById } from "../db/queries/tracks";

router.get("/tracks", async (req, res, next) => {
  const tracks = await getTracks();
  res.send(tracks);
});
router.post("/tracks", async (req, res) => {
  try {
    const trackData = req.body;
    // Save track data to database
    const newTrack = await createTrack(trackData);
    res.status(201).json(newTrack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/id", async (req, res, next) => {
  const track = await getTracksById(req.params.id);
  if (!track) return res.status(404).send("Track not found.");
  res.send(track);
});
