import express from "express";
const router = express.router();
export default router;

router.get("/users/:id/friends", async(req, res, next) => {
    try {
            const { id } = req.params;
    
            const user = await getUserFriends(id);
    
            if (!user) {
                return res.status(404).json({
                    message: "Friends not found"
                });
            }
    
            res.json(user);
    
        } catch (error) {
            console.log(error);
            next(error);
        }
    });