import express from "express";
import apiRouter from "./api/api.js";
import { dirname, resolve as resolvePath } from "path";
import { fileURLToPath } from "url";

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Health check endpoint (used by Azure App Service + deploy workflow)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", apiRouter);

// Serve the built frontend (Vite build output) in production.
// The frontend is built into ../frontend/dist during the Docker build.
const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendDist = resolvePath(currentDir, "../frontend/dist");
app.use(express.static(frontendDist));

// All non-API routes fall back to index.html (client-side routing).
// Uses middleware instead of "*" so it works with Express 5's path-to-regexp.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(resolvePath(frontendDist, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;
