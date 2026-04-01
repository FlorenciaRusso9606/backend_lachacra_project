# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# generar prisma client
RUN npx prisma generate

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./


RUN npm ci --omit=dev

# Copiar build y prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/index.js"]