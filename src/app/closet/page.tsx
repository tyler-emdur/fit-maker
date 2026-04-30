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

  async function toJpeg(raw: File): Promise<File> {
    const bitmap = await createImageBitmap(raw);
    const MAX = 1920;
    let { width, height } = bitmap;
    if (width > MAX || height > MAX) {
      const r = Math.min(MAX / width, MAX / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob failed"));
          resolve(new File([blob], raw.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88,
      ),
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;

    // Convert HEIC/HEIF → JPEG in the browser before uploading
    // macOS decodes HEIC natively so createImageBitmap works in Chrome + Safari
    const isHeic = /\.(heic|heif)$/i.test(raw.name) || raw.type === "image/heic" || raw.type === "image/heif";
    let file = raw;
    if (isHeic) {
      try {
        file = await toJpeg(raw);
      } catch (err) {
        console.warn("HEIC client conversion failed, sending original:", err);
      }
    }

    setPreview(URL.createObjectURL(file));
    setSuggestion(null);
    setAnalyzing(true);

    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/items/analyze", { method: "POST", body: data });
      const payload = await res.json() as Partial<AiSuggestion> & { error?: string };

      if (payload.imageUrl && payload.category) {
        setSuggestion(payload as AiSuggestion);
        setCategory(payload.category);
      }
    } catch (err) {
      console.error("analyze failed:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestion?.imageUrl) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("category", category);
    data.set("imageUrl", suggestion.imageUrl);
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", { method: "POST", body: data });
      if (res.ok) {
        form.reset();
        setSuggestion(null);
        setPreview(null);
        setCategory("short_sleeve");
        if (fileRef.current) fileRef.current.value = "";
        await refreshItems();
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("save failed:", res.status, body);
        alert(`Save failed: ${JSON.stringify(body?.error ?? res.status)}`);
      }
    } catch (err) {
      console.error("save error:", err);
      alert("Save failed — check the console for details.");
    } finally {
      setSubmitting(false);
    }
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3.5">
          <div>
            <span className="text-base font-semibold tracking-tight">Closet</span>
            <span className="ml-2 text-sm text-zinc-400">
              {loading ? "" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <a
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            ← Today
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-8">
        {/* Add form */}
        <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold">Add item</h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Upload area */}
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-300 hover:bg-zinc-100 focus:outline-none"
              >
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                    <p className="mt-3 text-sm font-medium text-zinc-600">Analyzing with Gemini…</p>
                    <p className="mt-1 text-xs text-zinc-400">This takes a few seconds</p>
                  </div>
                ) : preview ? (
                  <div className="relative h-56 w-full">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full rounded-[10px] object-contain p-3"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-lg">
                      +
                    </div>
                    <p className="mt-3 text-sm font-medium text-zinc-600">Upload a photo</p>
                    <p className="mt-1 text-xs text-zinc-400">JPG · PNG · WEBP · HEIC</p>
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

            {/* Fields — shown after analysis */}
            {suggestion && (
              <>
                {/* AI badge */}
                <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 border border-zinc-100 px-3.5 py-2.5">
                  <span className="shrink-0 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    AI · {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <p className="text-xs text-zinc-500 capitalize truncate">
                    {suggestion.type}
                    {suggestion.pattern && suggestion.pattern !== "solid" ? ` · ${suggestion.pattern}` : ""}
                    {` · warmth ${suggestion.warmthScore}/10`}
                    {suggestion.brand && suggestion.brand !== "Unknown" ? ` · ${suggestion.brand}` : ""}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    defaultValue={suggestion.suggestedName}
                    placeholder="e.g. White Crewneck"
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Category</span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      AI: {CATEGORY_LABEL[suggestion.category]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          category === opt.value
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500" htmlFor="color">
                    Color
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-500">
                      AI: {suggestion.color}
                    </span>
                  </label>
                  <input
                    id="color"
                    name="color"
                    defaultValue={suggestion.color}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                {/* Hidden fields */}
                <input type="hidden" name="warmthScore" value={suggestion.warmthScore} />
                <input type="hidden" name="pattern" value={suggestion.pattern} />
                <input type="hidden" name="brand" value={suggestion.brand} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Add to Closet"}
                </button>
              </>
            )}

            {!suggestion && !analyzing && !preview && (
              <p className="text-center text-xs text-zinc-400">Upload a photo to get started</p>
            )}
            {!suggestion && !analyzing && preview && (
              <p className="text-center text-xs text-zinc-400">Analysis failed — tap the photo to try again</p>
            )}
          </div>
        </form>

        {/* Items by category */}
        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-400">No items yet — add your first piece above.</p>
        ) : (
          <div className="space-y-8">
            {byCategory.map((group) => (
              <section key={group.value}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  {group.label}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="relative h-44 w-full bg-zinc-50">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="px-3 pb-3 pt-2.5">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400 capitalize">
                          {item.color}
                          {item.pattern && item.pattern !== "solid" ? ` · ${item.pattern}` : ""}
                          {item.brand && item.brand !== "Unknown" ? ` · ${item.brand}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={removingId === item.id}
                        className="absolute right-2 top-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-30"
                      >
                        {removingId === item.id ? "…" : "Remove"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
