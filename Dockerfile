FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx vite build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
RUN npm init -y >/dev/null && npm install pg@8.23.1 --no-audit --no-fund
COPY --from=build /app/.output ./.output
COPY scripts ./scripts
COPY migrations ./migrations
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node .output/server/index.mjs"]
