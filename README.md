# KIT‑X Style Micro‑Frontend Kit (MVP)

Minimal monorepo with:

-   miniapp-account-summary: React-in-WebComponent miniapp (Lit + React)
-   bff-account-summary: Apollo GraphQL BFF
-   shell-host: Demo shell that loads the miniapp bundle by URL

See docs/req.md for the architectural notes and file descriptions.

## Build & Run (Docker)

```bash
# from repo root
docker compose up --build

# Shell → http://localhost:5173
# Miniapp container (static) → http://localhost:8081
# BFF → http://localhost:8080/graphql
```

## Local Dev (optional)

-   Uses Yarn workspaces. From repo root run:

    -   Install: `yarn install`
    -   Build all: `yarn build`
    -   Run a package script: `yarn workspace <name> <script>`

    Each package remains runnable independently if desired.
