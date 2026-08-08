FROM node:20-alpine

# Prisma precisa de OpenSSL pra funcionar — não vem por padrão no Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Instala dependências primeiro (aproveita cache do Docker se só o código mudar)
COPY package.json package-lock.json* ./
RUN npm ci

# Copia o resto do código
COPY . .

# Gera o client do Prisma e builda o Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Aplica migrations pendentes toda vez que o container sobe (idempotente —
# só aplica o que ainda não foi aplicado) e então inicia o servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]