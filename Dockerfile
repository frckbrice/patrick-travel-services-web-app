# =========================
# Stage 1: Dependencies
# =========================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ bash
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files + prisma + config files
COPY package.json pnpm-lock.yaml* tsconfig.json prisma ./ 

# Install dependencies
RUN pnpm install --frozen-lockfile


# =========================
# Stage 2: Builder
# =========================
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
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

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

