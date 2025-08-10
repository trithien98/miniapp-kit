# KIT‑X Style Micro‑Frontend Kit

> A minimal, production‑minded example that follows the ideas in KIT‑X: web‑component wrapped React _miniapp_ + tightly coupled GraphQL BFF, containerized with Nginx/Express, loadable into any host _Shell_ via a small SDK. Includes health signals, runtime config injection, and a simple demo Shell.

---

## Repo layout

```
nbx-mfe-starter/
├─ packages/
│  ├─ miniapp-account-summary/               # React-in-WebComponent miniapp
│  │  ├─ src/
│  │  │  ├─ index.tsx                        # React entry (mounts into Shadow DOM)
│  │  │  ├─ webcomponent.ts                  # Lit custom element wrapper
│  │  │  ├─ sdk.ts                           # Miniapp contract + health events
│  │  │  ├─ types.ts                         # Shared types for the miniapp
│  │  │  └─ styles.css                       # Scoped styles adopted into shadow root
│  │  ├─ public/
│  │  │  └─ config.template.json             # Runtime config (injected at container start)
│  │  ├─ nginx/
│  │  │  ├─ default.conf                     # Serves static + /config.json
│  │  │  └─ docker-entrypoint.sh             # Env-to-config injection
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ bff-account-summary/                   # Apollo GraphQL BFF, tightly coupled to miniapp
│  │  ├─ src/
│  │  │  ├─ index.ts                         # ApolloServer + Express + health endpoint
│  │  │  ├─ schema.graphql                   # GraphQL schema
│  │  │  └─ datasources/AccountsAPI.ts       # Example RESTDataSource -> stitched GraphQL
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  └─ shell-host/                            # Demo Shell that loads the miniapp
│     ├─ public/index.html                   # Minimal host page
│     ├─ src/loader.ts                       # SDK loader (configurable)
│     ├─ package.json
│     └─ vite.config.ts
│
├─ docker-compose.yml
└─ README.md
```

---

## packages/miniapp-account-summary

### package.json

```json
{
    "name": "miniapp-account-summary",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "lit": "^3.1.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
    },
    "devDependencies": {
        "typescript": "^5.5.4",
        "vite": "^5.4.3"
    }
}
```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "jsx": "react-jsx",
        "moduleResolution": "Bundler",
        "strict": true,
        "skipLibCheck": true,
        "types": ["vite/client"]
    },
    "include": ["src"]
}
```

### src/types.ts

```ts
export type MiniappConfig = {
    bffUrl: string;
    appName: string;
    version: string;
};
```

### src/sdk.ts (Miniapp Contract + Health Signals)

```ts
/** Minimal SDK that each miniapp implements and shells can rely on. */
export const MINIAPP_EVENTS = {
    READY: "miniapp:ready",
    HEALTH: "miniapp:health",
    ERROR: "miniapp:error",
} as const;

export type HealthStatus = {
    app: string;
    version: string;
    ok: boolean;
    timestamp: number;
    details?: Record<string, unknown>;
};

export function emitReady(el: Element, details?: Record<string, unknown>) {
    el.dispatchEvent(
        new CustomEvent(MINIAPP_EVENTS.READY, {
            bubbles: true,
            composed: true,
            detail: details,
        })
    );
}

export function emitHealth(el: Element, status: HealthStatus) {
    el.dispatchEvent(
        new CustomEvent(MINIAPP_EVENTS.HEALTH, {
            bubbles: true,
            composed: true,
            detail: status,
        })
    );
}

export function emitError(el: Element, error: unknown) {
    el.dispatchEvent(
        new CustomEvent(MINIAPP_EVENTS.ERROR, {
            bubbles: true,
            composed: true,
            detail: { error },
        })
    );
}
```

### src/styles.css

```css
:host {
    display: block;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
        sans-serif;
}
.card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}
.balance {
    font-size: 32px;
    font-weight: 700;
}
.meta {
    color: #666;
    font-size: 12px;
    margin-top: 6px;
}
```

### src/index.tsx (React UI)

```tsx
import { useEffect, useState } from "react";
import type { MiniappConfig } from "./types";

export default function AccountSummary({ config }: { config: MiniappConfig }) {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<number | null>(null);
    const [owner, setOwner] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(config.bffUrl + "/graphql", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        query: `query { me { name } account { balance } }`,
                    }),
                });
                const json = await res.json();
                if (json.errors)
                    throw new Error(json.errors[0]?.message ?? "GraphQL error");
                setOwner(json.data.me.name);
                setBalance(json.data.account.balance);
            } catch (e: any) {
                setError(e.message ?? String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [config.bffUrl]);

    return (
        <div className="card" role="region" aria-label="Account summary">
            <div className="header">{config.appName}</div>
            {loading && <div>Loading…</div>}
            {error && <div role="alert">Error: {error}</div>}
            {!loading && !error && (
                <>
                    <div className="balance">$ {balance?.toLocaleString()}</div>
                    <div className="meta">Owner: {owner}</div>
                    <div className="meta">Version: {config.version}</div>
                </>
            )}
        </div>
    );
}
```

### src/webcomponent.ts (Lit wrapper mounting React into Shadow DOM)

```ts
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import AccountSummary from "./index";
import { emitReady, emitHealth } from "./sdk";
import type { MiniappConfig } from "./types";

const styleUrl = new URL("./styles.css", import.meta.url).href;

@customElement("kitx-account-summary")
export class KitXAccountSummary extends LitElement {
    @property({ type: String, attribute: "config-url" }) configUrl?: string;
    @property({ type: String, attribute: "version" }) version: string = "1.0.0";
    @property({ type: String, attribute: "app-id" }) appId: string =
        "account-summary";

    private root?: Root;
    private config?: MiniappConfig;

    createRenderRoot() {
        // Keep Shadow DOM for style isolation
        return super.createRenderRoot();
    }

    async connectedCallback() {
        super.connectedCallback();
        try {
            const cfgUrl = this.configUrl ?? "/config.json";
            const res = await fetch(cfgUrl, { cache: "no-store" });
            const runtime = await res.json();
            this.config = {
                appName: runtime.APP_NAME ?? "Account Summary",
                bffUrl: runtime.BFF_URL ?? "http://localhost:8080",
                version: this.version,
            };
            await this.mountReact();
            emitReady(this, { app: this.appId, version: this.version });
            emitHealth(this, {
                app: this.appId,
                version: this.version,
                ok: true,
                timestamp: Date.now(),
            });
        } catch (e) {
            emitHealth(this, {
                app: this.appId,
                version: this.version,
                ok: false,
                timestamp: Date.now(),
                details: { e },
            });
        }
    }

    private async mountReact() {
        // Inject scoped stylesheet into shadow root
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", styleUrl);
        this.renderRoot.appendChild(link);

        // Mount React inside the shadow root
        const host = document.createElement("div");
        this.renderRoot.appendChild(host);
        this.root = createRoot(host);
        this.root.render(
            React.createElement(AccountSummary, { config: this.config! })
        );
    }

    disconnectedCallback(): void {
        this.root?.unmount();
        super.disconnectedCallback();
    }

    render() {
        return html``;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "kitx-account-summary": KitXAccountSummary;
    }
}
```

### public/config.template.json (runtime‑injected)

```json
{
    "APP_NAME": "Account Summary",
    "BFF_URL": "${BFF_URL}"
}
```

### nginx/default.conf

```nginx
server {
  listen 80;
  server_name _;
  root   /usr/share/nginx/html;
  index  index.html;

  # Serve runtime config
  location = /config.json {
    default_type application/json;
    try_files /config.json =404;
    add_header Cache-Control "no-store";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### nginx/docker-entrypoint.sh

```bash
#!/usr/bin/env sh
set -e

# Replace env placeholders in config.template.json -> /usr/share/nginx/html/config.json
: "${BFF_URL:=http://localhost:8080}"

envsubst < /usr/share/nginx/html/config.template.json > /usr/share/nginx/html/config.json
exec nginx -g 'daemon off;'
```

### Dockerfile (miniapp)

```Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm i --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY public/config.template.json /usr/share/nginx/html/config.template.json
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENV BFF_URL="http://bff:8080"
ENTRYPOINT ["/docker-entrypoint.sh"]
```

---

## packages/bff-account-summary

### package.json

```json
{
    "name": "bff-account-summary",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "ts-node-dev --respawn src/index.ts",
        "start": "node dist/index.js",
        "build": "tsc -p ."
    },
    "dependencies": {
        "@apollo/server": "^4.10.0",
        "apollo-datasource-rest": "^3.7.0",
        "cors": "^2.8.5",
        "express": "^4.19.2",
        "graphql": "^16.9.0"
    },
    "devDependencies": {
        "ts-node-dev": "^2.0.0",
        "typescript": "^5.5.4"
    }
}
```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "outDir": "dist",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
    },
    "include": ["src"]
}
```

### src/schema.graphql

```graphql
type Query {
    me: User!
    account: Account!
}

type User {
    id: ID!
    name: String!
}

type Account {
    id: ID!
    balance: Float!
}
```

### src/datasources/AccountsAPI.ts

```ts
import { RESTDataSource } from "apollo-datasource-rest";

export class AccountsAPI extends RESTDataSource {
    override baseURL =
        process.env.ACCOUNTS_BASE_URL ?? "https://example.org/mock/";

    async getMe() {
        return { id: "u1", name: "Jane Doe" };
    }
    async getAccount() {
        return { id: "a1", balance: 12543.77 };
    }
}
```

### src/index.ts

```ts
import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { AccountsAPI } from "./datasources/AccountsAPI";

const typeDefs = await readFile(
    new URL("./schema.graphql", import.meta.url),
    "utf8"
);

const resolvers = {
    Query: {
        me: async (_: any, __: any, { dataSources }: any) =>
            dataSources.accounts.getMe(),
        account: async (_: any, __: any, { dataSources }: any) =>
            dataSources.accounts.getAccount(),
    },
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

const app = express();
app.use(cors());

// Health endpoints (Shells can poll if desired)
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
        context: async () => ({}),
    })
);

app.listen(8080, () => {
    // eslint-disable-next-line no-console
    console.log("BFF listening on 8080");
});
```

### Dockerfile (BFF)

```Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm i --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

---

## packages/shell-host (Demo Shell)

### package.json

```json
{
    "name": "shell-host",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "devDependencies": {
        "typescript": "^5.5.4",
        "vite": "^5.4.3"
    },
    "dependencies": {}
}
```

### vite.config.ts

```ts
import { defineConfig } from "vite";
export default defineConfig({
    server: { port: 5173 },
});
```

### public/index.html

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KIT‑X Style Shell</title>
        <script type="module" src="/src/loader.ts"></script>
    </head>
    <body>
        <h1>Shell Host</h1>

        <!-- The Shell decides what version/config to load -->
        <kitx-account-summary
            app-id="account-summary"
            version="1.0.0"
            config-url="http://localhost:8081/config.json"
        ></kitx-account-summary>

        <pre id="events"></pre>
    </body>
</html>
```

### src/loader.ts (SDK Loader in Shell)

```ts
// Load the miniapp web component bundle dynamically (could be from CDN, S3, etc)
(async function load() {
    // In real shells, this mapping is policy/feature-flag controlled
    const miniappUrl = "http://localhost:8081/assets/index.js"; // Vite build output path

    await import(miniappUrl);

    // Listen to health and ready events
    const events = document.getElementById("events")!;
    window.addEventListener("miniapp:ready" as any, (e: any) => {
        events.textContent += `READY → ${JSON.stringify(e.detail)}\n`;
    });
    window.addEventListener("miniapp:health" as any, (e: any) => {
        events.textContent += `HEALTH → ${JSON.stringify(e.detail)}\n`;
    });
})();
```

> **Note**: In production you’d serve the miniapp’s built JS from its own origin/container. The Shell loads it by URL (code or config).

---

## docker-compose.yml

```yaml
version: "3.9"
services:
    bff:
        build: ./packages/bff-account-summary
        ports: ["8080:8080"]

    miniapp:
        build: ./packages/miniapp-account-summary
        environment:
            BFF_URL: http://bff:8080
        ports: ["8081:80"]
        depends_on: [bff]

    shell:
        build:
            context: ./packages/shell-host
            dockerfile: Dockerfile
        ports: ["5173:5173"]
        depends_on: [miniapp]
```

> For `shell-host`, use this super‑small Dockerfile if you want to containerize the demo server too:

```Dockerfile
# packages/shell-host/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm i --no-audit --no-fund
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
```

---

## Build & Run

```bash
# from repo root
docker compose up --build

# Shell → http://localhost:5173
# Miniapp container (static) → http://localhost:8081
# BFF → http://localhost:8080/graphql
```

---

## Versioning & Adoption control (pattern)

-   **Miniapp** image tags (e.g., `miniapp-account-summary:1.3.2`) published to registry.
-   **Shell** selects a version per route/feature via config (flag) → URL to `index.js` of that version.
-   Multiple versions can co‑exist. Rollout by changing the Shell’s config; roll back by pinning a previous tag.

---

## Security, Observability, and Guardrails

-   **Auth**: Externalize. Shell injects auth context (e.g., bearer token) into BFF via header policy; miniapp never stores secrets.
-   **CSP**: Serve strict CSP from each origin; avoid `unsafe-inline` (use hashed styles or external CSS like above).
-   **Accessibility**: Build a GEL component library (out of scope here); miniapp composes those.
-   **Tracing**: Add `traceparent` propagation from Shell → Miniapp fetch → BFF (use W3C Trace Context). Add request IDs to events.
-   **Health**: Miniapp dispatches `miniapp:health`; BFF exposes `/health`; Shell aggregates.

---

## Extending this kit

-   Swap React for Vue/Svelte inside the wrapper — contract unchanged.
-   Add a monorepo workspace tool (pnpm/turbo) to share types and GEL components.
-   Build a _catalog service_ that stores available miniapps + versions + URLs for Shells to query at runtime.

---

## FAQ (KIT‑X mapping)

-   **WebComponents (Custom Element + Shadow DOM)** → framework‑agnostic boundary & style isolation.
-   **BFF per miniapp** → tight coupling limits blast radius; GraphQL stitches downstream REST.
-   **Runtime config** → injected at container start (env → `config.json`).
-   **Federated delivery** → any Shell can load miniapp by URL and listen to health signals.

---

> Ready for me to package this as a real GitHub repo or tailor it to your stack (Vite + Next.js shell, pnpm workspaces, CI/CD)? Tell me your preferences and I’ll adapt.
