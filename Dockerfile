# syntax=docker/dockerfile-upstream:1.4
#
# Multi-stage Dockerfile for BeatForge.
# Builds the Vite frontend and the Node/Express backend, then serves
# both from a single lightweight image.
#
# Build:  docker build -t beatforge .
# Run:    docker run -p 3000:3000 --env-file .env beatforge

# ---- Stage 1: build the frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /build

COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/

RUN cd frontend && npm ci && npm run build

# ---- Stage 2: build the backend ----
FROM node:22-alpine AS backend-builder

WORKDIR /build

COPY backend/package*.json ./backend/
COPY backend/ ./backend/

RUN cd backend && npm ci --omit=dev

# ---- Stage 3: runtime image ----
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy backend (production deps only)
COPY --from=backend-builder /build/backend ./backend

# Copy the built frontend into the location app.js expects
# (../frontend/dist relative to backend/)
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Copy migrations + scripts
COPY --from=backend-builder /build/backend/db/migrations ./backend/db/migrations
COPY --from=backend-builder /build/backend/scripts ./backend/scripts

# The .env is expected at the project root (../.env from backend/).
# In production, pass secrets via environment variables instead.
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Run migrations on startup, then start the server.
# Migrations are idempotent (IF NOT EXISTS), so this is safe on every boot.
CMD ["sh", "-c", "node backend/scripts/runMigrations.js && node backend/server.js"]