# =============================================================================
# Stage 1: Build Frontend and Backend
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite frontend (inlined during vite build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_URL=${VITE_API_URL}

# Copy package manifests for efficient layer caching
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install all dependencies (including devDependencies required for tsc and vite)
RUN npm ci

# Copy all source files
COPY . .

# Build both backend (tsc) and frontend (vite build)
RUN npm run build

# =============================================================================
# Stage 2: Production Runtime
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container health check
RUN apk add --no-cache curl

# Copy root package manifests and install only production dependencies
COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --omit=dev --workspace=backend

# Copy built backend code and fixtures
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/fixtures ./fixtures

# Copy built frontend distribution (served automatically by backend/src/app.ts)
COPY --from=builder /app/frontend/dist ./frontend/dist

# Use non-root node user for security
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "backend/dist/index.js"]

