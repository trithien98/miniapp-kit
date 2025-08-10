import { LitElement, html } from "lit";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import AccountSummary from "./index";
import { emitReady, emitHealth } from "./sdk";
import type { MiniappConfig } from "./types";

const styleUrl = new URL("./styles.css", import.meta.url).href;

export class KitXAccountSummary extends LitElement {
    static properties = {
        configUrl: { type: String, attribute: "config-url" },
        version: { type: String, attribute: "version" },
        appId: { type: String, attribute: "app-id" },
    } as const;

    configUrl?: string;
    version: string = "1.0.0";
    appId: string = "account-summary";

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
            // Ensure first update cycle completes so shadow root exists then mount React
            if ((this as any).updateComplete) {
                await (this as any).updateComplete;
            }
            await this.mountReact();
            emitReady(this as unknown as Element, {
                app: this.appId,
                version: this.version,
            });
            emitHealth(this as unknown as Element, {
                app: this.appId,
                version: this.version,
                ok: true,
                timestamp: Date.now(),
            });
        } catch (e) {
            emitHealth(this as unknown as Element, {
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
        ((this as any).shadowRoot as ShadowRoot).appendChild(link);

        // Mount React inside the shadow root
        const host = document.createElement("div");
        ((this as any).shadowRoot as ShadowRoot).appendChild(host);
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

// Define the custom element without using decorators
customElements.define("kitx-account-summary", KitXAccountSummary);

declare global {
    interface HTMLElementTagNameMap {
        "kitx-account-summary": KitXAccountSummary;
    }
}
