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
        if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL error");
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
