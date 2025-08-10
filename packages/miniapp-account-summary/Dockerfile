FROM node:20-alpine AS deps
WORKDIR /work
COPY package.json yarn.lock ./
COPY packages/*/package.json packages/*/
RUN yarn install --frozen-lockfile --non-interactive

FROM node:20-alpine AS build
WORKDIR /work
COPY . .
COPY --from=deps /work/node_modules ./node_modules
RUN yarn workspace miniapp-account-summary build

FROM nginx:1.27-alpine
COPY --from=build /work/packages/miniapp-account-summary/dist/ /usr/share/nginx/html/
COPY packages/miniapp-account-summary/public/config.template.json /usr/share/nginx/html/config.template.json
COPY packages/miniapp-account-summary/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY packages/miniapp-account-summary/nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENV BFF_URL="http://bff:8080"
ENTRYPOINT ["/docker-entrypoint.sh"]
