import express from "express";
import apiRouter from "./api/api.js";

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
import { static as expressStatic, resolve as resolvePath } from "path";
const frontendDist = resolvePath(__dirname, "../frontend/dist");
app.use(expressStatic(frontendDist));

// All non-API routes fall back to index.html (client-side routing).
app.get("*", (req, res) => {
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
