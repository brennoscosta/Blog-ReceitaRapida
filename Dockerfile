# --- deps (apenas para o server) ---
FROM node:20-alpine AS deps
WORKDIR /app/server
# copie só os manifests do server
COPY server/package*.json ./
RUN npm ci

# --- build do server ---
FROM node:20-alpine AS build
WORKDIR /app/server
COPY --from=deps /app/server/node_modules ./node_modules
# copie o código do server
COPY server/ .
# se usar Prisma, descomente: RUN npx prisma generate
RUN npm run build

# --- runner (produção) ---
FROM node:20-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# apenas o que é necessário para rodar
COPY --from=build /app/server/package*.json ./
COPY --from=build /app/server/dist ./dist
# se você tiver pastas necessárias em runtime (ex.: public/, prisma/, .env.prod copiado por build),
# copie aqui também:
# COPY --from=build /app/server/public ./public
# COPY --from=build /app/server/prisma ./prisma

RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node","dist/index.js"]
