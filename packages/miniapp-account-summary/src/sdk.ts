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
    }),
  );
}

export function emitHealth(el: Element, status: HealthStatus) {
  el.dispatchEvent(
    new CustomEvent(MINIAPP_EVENTS.HEALTH, {
      bubbles: true,
      composed: true,
      detail: status,
    }),
  );
}

export function emitError(el: Element, error: unknown) {
  el.dispatchEvent(
    new CustomEvent(MINIAPP_EVENTS.ERROR, {
      bubbles: true,
      composed: true,
      detail: { error },
    }),
  );
}
