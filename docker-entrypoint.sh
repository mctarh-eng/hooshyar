#!/bin/sh
# ─────────────────────────────────────────────────────────────
#  هوش‌یار — container entrypoint
#  1) Writes .z-ai-config from ZAI_BASE_URL / ZAI_API_KEY env vars
#     (the AI SDK reads ./.z-ai-config — see z-ai-web-dev-sdk docs)
#  2) Syncs the SQLite schema (idempotent, safe on every boot)
#  3) Starts the Next.js standalone server
# ─────────────────────────────────────────────────────────────
set -e

echo "> hooshyar container starting..."

# 1) AI provider credentials -> .z-ai-config
if [ -n "$ZAI_BASE_URL" ] && [ -n "$ZAI_API_KEY" ]; then
  cat > /app/.z-ai-config <<EOF
{"baseUrl":"$ZAI_BASE_URL","apiKey":"$ZAI_API_KEY"}
EOF
  chmod 600 /app/.z-ai-config
  echo "> .z-ai-config written from environment variables"
elif [ -f /app/.z-ai-config ]; then
  echo "> using existing /app/.z-ai-config"
else
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "! WARNING: no AI credentials found.                  !"
  echo "! Set ZAI_BASE_URL + ZAI_API_KEY env vars (see       !"
  echo "! .env.example) or mount your own /app/.z-ai-config. !"
  echo "! The app UI will start, but AI calls will fail.     !"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
fi

# 2) Database schema (creates tables on first run, no-op afterwards)
mkdir -p /app/data
echo "> syncing database schema..."
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

# 3) Start server (respects $PORT, default 3000)
echo "> starting hooshyar on port ${PORT:-3000} 🚀"
exec node server.js
