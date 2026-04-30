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
        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
        onClick={regenerate}
        type="button"
        disabled={loading}
      >
        {loading ? "Finding a new outfit..." : "Try a different outfit"}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
