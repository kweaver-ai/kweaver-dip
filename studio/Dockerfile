FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/assets ./assets
COPY --from=build /app/templates ./templates
COPY --from=build /app/built-in ./built-in
COPY --from=build /app/extensions ./extensions
COPY --from=build /app/scripts ./scripts

RUN mkdir -p /data/.openclaw/workspace

EXPOSE 3100

CMD ["node", "dist/server.js"]
