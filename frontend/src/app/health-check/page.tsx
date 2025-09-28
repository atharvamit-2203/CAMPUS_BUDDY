"use client";

import React from "react";

export const dynamic = "force-dynamic"; // ensure this page executes on the client

export default function HealthCheckPage() {
  const [status, setStatus] = React.useState<
    { ok: boolean; code: number; text: string; json?: any } | null
  >(null);
  const [error, setError] = React.useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  const healthURL = API_BASE ? `${API_BASE}/health` : "";

  React.useEffect(() => {
    const run = async () => {
      if (!healthURL) {
        setError(
          "NEXT_PUBLIC_API_URL is not set. Configure it in Vercel Project Settings → Environment Variables."
        );
        return;
      }
      try {
        const res = await fetch(healthURL, { cache: "no-store" });
        const text = await res.text();
        let json: any | undefined = undefined;
        try {
          json = JSON.parse(text);
        } catch {}
        setStatus({ ok: res.ok, code: res.status, text, json });
      } catch (e: any) {
        setError(e?.message || "Request failed");
      }
    };
    run();
  }, [healthURL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Backend Health Check</h1>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <div className="text-gray-400 text-sm">Backend Base URL</div>
            <div className="text-white font-mono break-all">{API_BASE || "(not set)"}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Health Endpoint</div>
            <div className="text-white font-mono break-all">{healthURL || "(not set)"}</div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}

          {status && (
            <div className="space-y-3">
              <div>
                <span className={`px-2 py-1 rounded text-sm ${status.ok ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  HTTP {status.code} {status.ok ? "OK" : "ERROR"}
                </span>
              </div>
              {status.json ? (
                <pre className="bg-white/5 border border-white/10 rounded p-3 overflow-auto text-sm">
                  {JSON.stringify(status.json, null, 2)}
                </pre>
              ) : (
                <pre className="bg-white/5 border border-white/10 rounded p-3 overflow-auto text-sm">
                  {status.text}
                </pre>
              )}
            </div>
          )}

          {!status && !error && (
            <div className="text-gray-300">Checking...</div>
          )}
        </div>

        <div className="text-gray-400 text-sm mt-6 space-y-2">
          <p>
            If this page shows a network or CORS error, ensure your FastAPI backend is public and that CORS allows your Vercel domain (e.g., https://your-project.vercel.app).
          </p>
          <p>
            After updating environment variables in Vercel, redeploy to apply the changes.
          </p>
        </div>
      </div>
    </div>
  );
}