FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci

FROM dependencies AS build

COPY tsconfig.base.json ./
COPY apps/backend apps/backend

RUN npm run build --workspace @picasso/backend \
    && npm prune --omit=dev

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/backend/dist ./apps/backend/dist
COPY --from=build --chown=node:node /app/apps/backend/prisma ./apps/backend/prisma

USER node

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
