# ─────────────────────────────────────────────────────────────
#  هوش‌یار — Production image (Next.js standalone + Prisma)
#  Build :  docker build -t hooshyar .
#  Run   :  docker compose up -d
# ─────────────────────────────────────────────────────────────

# ---------- Stage 1: dependencies ----------
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- Stage 2: build ----------
FROM oven/bun:1 AS builder
WORKDIR /app
ENV DATABASE_URL="file:/tmp/build.db"
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

# ---------- Stage 3: runtime (node needed for prisma CLI) ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL="file:/app/data/custom.db" \
    NEXT_TELEMETRY_DISABLED=1

# openssl is required by Prisma engines
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Next.js standalone output (includes server.js, .next/static, public)
COPY --from=builder /app/.next/standalone ./

# Prisma CLI + client + engines (for "db push" on first boot)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Startup script: writes .z-ai-config from env vars, syncs DB, starts server
COPY docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# SQLite lives here -> mount a volume on this path
VOLUME /app/data

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
