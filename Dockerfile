# --- Build Stage ---
FROM node:22-alpine AS builder

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code and TS config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN pnpm build

# --- Runtime Stage ---
FROM node:22-alpine AS runner

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production

# Copy package info
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Run as non-root user for security best practices
USER node

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/server.js"]
