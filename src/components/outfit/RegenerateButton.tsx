"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegenerateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function regenerate() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/outfit/today", { method: "POST" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not regenerate.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        className="w-full border border-[#e8e8e8] bg-white py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40"
        onClick={regenerate}
        type="button"
        disabled={loading}
      >
        {loading ? "Finding a new fit…" : "Try a different fit"}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
