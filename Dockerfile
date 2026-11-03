# Multi-stage build for the HausJo web app (Next.js standalone + Prisma)
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM node:22-alpine AS run
WORKDIR /app
# postgresql16-client provides pg_dump for the daily database backup (server is Postgres 16)
RUN apk add --no-cache openssl postgresql16-client tar && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
# Full node_modules: the Prisma CLI (schema sync at start-up) needs its own dependencies
COPY --from=build /app/node_modules ./node_modules
RUN mkdir -p /data/uploads && chown -R app:app /data && chown app:app /app
USER app
EXPOSE 3000
# Apply the schema, make sure the first admin exists, then start the server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node scripts/create-admin.mjs && node server.js"]
