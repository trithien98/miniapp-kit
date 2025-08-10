FROM node:20-alpine AS deps
WORKDIR /work
COPY package.json yarn.lock ./
COPY packages/*/package.json packages/*/
RUN yarn install --frozen-lockfile --non-interactive

FROM node:20-alpine AS build
WORKDIR /work
COPY . .
COPY --from=deps /work/node_modules ./node_modules
RUN yarn workspace shell-host build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /work/packages/shell-host/package.json ./package.json
COPY --from=deps /work/node_modules ./node_modules
COPY --from=build /work/packages/shell-host/dist ./dist
EXPOSE 5173
CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "5173"]
