# ---------------------------------------------------------------------------
# FarmaSystem Web (Next.js) — build multi-stage (saída standalone)
# ---------------------------------------------------------------------------

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* é embutido no bundle em tempo de build (roda no navegador),
# por isso precisa ser conhecido aqui. Aponta para a API acessível pelo browser.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---------------------------------------------------------------------------
# Runtime: apenas o servidor standalone e os assets estáticos.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node

EXPOSE 3001
CMD ["node", "server.js"]
