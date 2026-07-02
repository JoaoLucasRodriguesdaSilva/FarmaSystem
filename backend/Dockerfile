# ---------------------------------------------------------------------------
# FarmaSystem API (NestJS) — build multi-stage
# ---------------------------------------------------------------------------

# Etapa de build: instala dependências (com toolchain para compilar bcrypt),
# compila o TypeScript e remove as devDependencies.
FROM node:20-alpine AS builder
WORKDIR /app

# bcrypt precisa compilar módulo nativo em Alpine (musl).
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Mantém apenas dependências de produção (bcrypt já compilado permanece).
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Etapa de runtime: imagem enxuta apenas com o necessário para rodar.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Schema SQL disponível na imagem (referência/execução manual, se necessário).
COPY db ./db

# Executa como usuário sem privilégios.
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
