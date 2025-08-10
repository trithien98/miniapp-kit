// Load the miniapp web component bundle dynamically (could be from CDN, S3, etc)
(async function load() {
  // In real shells, this mapping is policy/feature-flag controlled
  const candidates = [
    { base: "http://localhost:8081", path: "/src/webcomponent.ts" }, // dev server
    { base: "http://localhost:8081", path: "/assets/index.js" }, // built but served by dev (unlikely)
    { base: "http://localhost:8082", path: "/assets/index.js" }, // preview server
  ];

  let chosenBase: string | null = null;
  let lastErr: unknown;
  for (const c of candidates) {
    try {
      await import(/* @vite-ignore */ `${c.base}${c.path}`);
      chosenBase = c.base;
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!chosenBase) {
    console.error("Failed to load miniapp bundle", lastErr);
    return;
  }

  // Point the component to the matching config.json endpoint
  const wc = document.querySelector("kitx-account-summary");
  if (wc) wc.setAttribute("config-url", `${chosenBase}/config.json`);

  // Listen to health and ready events
  const events = document.getElementById("events")!;
  window.addEventListener("miniapp:ready" as any, (e: any) => {
    events.textContent += `READY → ${JSON.stringify(e.detail)}\n`;
  });
  window.addEventListener("miniapp:health" as any, (e: any) => {
    events.textContent += `HEALTH → ${JSON.stringify(e.detail)}\n`;
  });
})();
