FROM node:20-alpine AS deps
WORKDIR /work
COPY package.json yarn.lock ./
COPY packages/*/package.json packages/*/
RUN yarn install --frozen-lockfile --non-interactive

FROM node:20-alpine AS build
WORKDIR /work
COPY . .
COPY --from=deps /work/node_modules ./node_modules
RUN yarn workspace bff-account-summary build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /work/packages/bff-account-summary/package.json ./package.json
COPY --from=deps /work/node_modules ./node_modules
COPY --from=build /work/packages/bff-account-summary/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
