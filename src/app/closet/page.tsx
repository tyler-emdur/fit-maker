"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Category, ClothingItem } from "@/lib/types";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "short_sleeve", label: "Short Sleeve" },
  { value: "long_sleeve", label: "Long Sleeve" },
  { value: "pants", label: "Pants" },
  { value: "shorts", label: "Shorts" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
];

const CATEGORY_LABEL: Record<Category, string> = {
  short_sleeve: "Short Sleeve",
  long_sleeve: "Long Sleeve",
  pants: "Pants",
  shorts: "Shorts",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

type AiSuggestion = {
  imageUrl: string;
  category: Category;
  suggestedName: string;
  brand: string;
  type: string;
  color: string;
  pattern: string;
  warmthScore: number;
  confidence: number;
};

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [category, setCategory] = useState<Category>("short_sleeve");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refreshItems() {
    const res = await fetch("/api/items");
    const payload = (await res.json()) as { items: ClothingItem[] };
    setItems((payload.items ?? []).filter((i) => i.active));
    setLoading(false);
  }

  useEffect(() => { refreshItems(); }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSuggestion(null);
    setAnalyzing(true);

    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/items/analyze", { method: "POST", body: data });
    const payload = await res.json() as Partial<AiSuggestion> & { error?: string };

    if (payload.imageUrl && payload.category && payload.confidence !== 0) {
      setSuggestion(payload as AiSuggestion);
      setCategory(payload.category);
    }
    setAnalyzing(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestion?.imageUrl) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("category", category);
    data.set("imageUrl", suggestion.imageUrl);
    setSubmitting(true);
    const res = await fetch("/api/items", { method: "POST", body: data });
    if (res.ok) {
      form.reset();
      setSuggestion(null);
      setPreview(null);
      setCategory("short_sleeve");
      if (fileRef.current) fileRef.current.value = "";
      await refreshItems();
    }
    setSubmitting(false);
  }

  async function removeItem(id: number) {
    setRemovingId(id);
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  }

  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Closet</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {loading ? "Loading..." : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <a
          href="/"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-zinc-50 transition-colors"
        >
          ← Today's Fit
        </a>
      </div>

      {/* Add form */}
      <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold">Add item</h2>

        {/* Step 1: Photo upload — triggers AI analysis */}
        <div className="mb-5">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">
            Photo
            <span className="ml-2 font-normal text-zinc-400 text-xs">Upload first — AI will fill in the details</span>
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-5 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100 focus:outline-none"
          >
            {analyzing ? (
              <div className="py-2">
                <p className="text-sm font-medium text-zinc-600 animate-pulse">Analyzing with AI...</p>
                <p className="mt-1 text-xs text-zinc-400">Claude is reading your photo</p>
              </div>
            ) : preview ? (
              <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
            ) : (
              <div className="py-2">
                <p className="text-sm font-medium text-zinc-600">Click to upload a photo</p>
                <p className="mt-1 text-xs text-zinc-400">JPG, PNG, WEBP</p>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Step 2: Fields (shown after analysis) */}
        {suggestion && (
          <>
            {/* AI summary bar */}
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
              <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                AI {Math.round(suggestion.confidence * 100)}%
              </span>
              <p className="text-xs text-zinc-600 capitalize">
                {suggestion.type} · {suggestion.pattern} · warmth {suggestion.warmthScore}/10
                {suggestion.brand !== "Unknown" ? ` · ${suggestion.brand}` : ""}
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={suggestion.suggestedName}
                placeholder="e.g. White Crewneck"
                required
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">
                Category
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-500">
                  AI: {CATEGORY_LABEL[suggestion.category]}
                </span>
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      category === opt.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700" htmlFor="color">
                Color
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-500">
                  AI: {suggestion.color}
                </span>
              </label>
              <input
                id="color"
                name="color"
                defaultValue={suggestion.color}
                required
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Hidden fields passed to POST /api/items */}
            <input type="hidden" name="warmthScore" value={suggestion.warmthScore} />
            <input type="hidden" name="pattern" value={suggestion.pattern} />
            <input type="hidden" name="brand" value={suggestion.brand} />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add to Closet"}
            </button>
          </>
        )}

        {!suggestion && !analyzing && !preview && (
          <p className="text-center text-xs text-zinc-400 pb-1">Upload a photo to get started</p>
        )}
        {!suggestion && !analyzing && preview && (
          <p className="text-center text-xs text-zinc-400 pb-1">Upload failed — try a different photo</p>
        )}
      </form>

      {/* Items by category */}
      <div className="mt-10 space-y-8">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading your closet...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-400">No items yet — add your first piece above.</p>
        ) : (
          byCategory.map((group) => (
            <section key={group.value}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="relative h-44 w-full bg-zinc-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate font-medium text-sm">{item.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-400 capitalize">
                        {CATEGORY_LABEL[item.category]} · {item.color}
                        {item.pattern && item.pattern !== "solid" ? ` · ${item.pattern}` : ""}
                        {item.brand && item.brand !== "Unknown" ? ` · ${item.brand}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={removingId === item.id}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-40"
                    >
                      {removingId === item.id ? "..." : "Remove"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
