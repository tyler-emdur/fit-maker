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
    <div className="flex items-center gap-3">
      <button
        className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        onClick={regenerate}
        type="button"
        disabled={loading}
      >
        {loading ? "Regenerating..." : "Regenerate Outfit"}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
}

