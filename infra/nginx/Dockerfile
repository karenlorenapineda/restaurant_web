FROM node:22-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci

COPY tsconfig.base.json ./
COPY apps/frontend apps/frontend

RUN npm run build --workspace @picasso/frontend

FROM nginx:1.28-alpine

RUN apk add --no-cache openssl

COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/entrypoint.sh /usr/local/bin/picasso-nginx-entrypoint
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html

RUN chmod +x /usr/local/bin/picasso-nginx-entrypoint

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/picasso-nginx-entrypoint"]
