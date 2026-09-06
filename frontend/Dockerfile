FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time VITE_* vars are not required: src/config/env.js already defaults
# apiBaseUrl to "" (same-origin, proxied by nginx) and apiPrefix to "/api/v1".
# To override, add ARG/ENV lines here and pass build.args from docker-compose.
RUN npm run build


FROM nginx:alpine

# Our SPA + reverse-proxy config (replaces the stock default.conf).
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Note the trailing ';' — nginx -g requires valid directive syntax.
CMD ["nginx", "-g", "daemon off;"]
