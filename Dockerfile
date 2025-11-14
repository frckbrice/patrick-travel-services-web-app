# =========================
# Stage 1: Dependencies
# =========================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files AND prisma folder (required for postinstall scripts)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies (prisma/schema.prisma now exists, postinstall succeeds)
RUN pnpm install --frozen-lockfile

# =========================
# Stage 2: Builder
# =========================
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy installed node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy full project source
COPY . .

# Build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client (safe now)
RUN pnpm prisma generate

# Build Next.js in standalone mode
RUN pnpm build

# =========================
# Stage 3: Runner
# =========================
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
