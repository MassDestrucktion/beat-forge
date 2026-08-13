import { verifyToken } from "./extra.js";

export default function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyToken(token);

        req.user = payload;

        next();
    } catch (error) {
        return res.status(401).send("Invalid token");
    }
}