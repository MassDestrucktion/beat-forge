/** Requires a logged-in user */
export default async function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).send("Unauthorized");
  next();
}