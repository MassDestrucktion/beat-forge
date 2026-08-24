import express from "express";
import { fileURLToPath } from "url";
import { dirname, resolve as resolvePath } from "path";

import apiRouter from "./api/api.js";

const app = express();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", apiRouter);

// Serve the built frontend
const frontendDist = resolvePath(__dirname, "../frontend/dist");

app.use(express.static(frontendDist));

// SPA fallback for React/Vite client-side routes
app.get("/{*splat}", (req, res) => {
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