# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
# Instala o libc6-compat para compatibilidade com algumas dependências nativas.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

# Estágio 2: Build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app
# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia o restante do código-fonte
COPY . .

# Desabilita a telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Executa o build de produção
RUN npm run build

# Estágio 3: Imagem final de produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria um usuário e grupo dedicados para a aplicação por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a pasta 'public' do estágio de build
COPY --from=builder /app/public ./public

# Copia a saída 'standalone' otimizada do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copia os assets estáticos
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Define o usuário para executar a aplicação
USER nextjs

# Expõe a porta 3000
EXPOSE 3000

# Define a porta para o Next.js ouvir
ENV PORT 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]