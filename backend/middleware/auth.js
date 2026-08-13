/**
 * Auth middleware
 *
 * Extracts and verifies the JWT bearer token from the
 * Authorization header. Sets req.user = { id } on success
 * or req.user = null if no token / invalid token.
 */

import { verifyToken } from "../jwt/jwt.js";

/**
 * Optional auth — never throws, just sets req.user to null
 * if no valid token is provided.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
  } catch {
    req.user = null;
  }

  next();
}

/**
 * Required auth — returns 401 if no valid token is provided.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
