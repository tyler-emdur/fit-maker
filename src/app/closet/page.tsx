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

  async function normalise(raw: File): Promise<File> {
    const bitmap = await createImageBitmap(raw);
    const MAX = 1600;
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
          const name = raw.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88,
      ),
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;

    let file = raw;
    try {
      file = await normalise(raw);
    } catch (err) {
      console.warn("Image normalisation failed, uploading original:", err);
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
      <header className="sticky top-0 z-10 border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-black tracking-tight">CLOSET</span>
            {!loading && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                {items.length} {items.length !== 1 ? "pieces" : "piece"}
              </span>
            )}
          </div>
          <a
            href="/"
            className="text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline"
          >
            Today&apos;s Fit
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-8">
        {/* Add form */}
        <form onSubmit={submit} className="overflow-hidden border border-[#e8e8e8] bg-white">
          <div className="border-b border-[#e8e8e8] px-5 py-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Add Item
            </h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Upload area */}
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-[#e8e8e8] bg-[#f8f8f8] transition-colors hover:border-zinc-300 hover:bg-[#f2f2f2] focus:outline-none"
              >
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                      Analyzing…
                    </p>
                  </div>
                ) : preview ? (
                  <div className="relative h-56 w-full">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="flex h-9 w-9 items-center justify-center border border-[#e8e8e8] bg-white text-lg text-zinc-400">
                      +
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                      Upload a photo
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-400">JPG · PNG · WEBP · HEIC</p>
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
                <div className="flex items-center gap-3 border border-[#e8e8e8] bg-[#f8f8f8] px-3.5 py-2.5">
                  <span className="shrink-0 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                    AI · {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <p className="truncate text-[11px] text-zinc-400 capitalize">
                    {suggestion.type}
                    {suggestion.pattern && suggestion.pattern !== "solid" ? ` · ${suggestion.pattern}` : ""}
                    {` · warmth ${suggestion.warmthScore}/10`}
                    {suggestion.brand && suggestion.brand !== "Unknown" ? ` · ${suggestion.brand}` : ""}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    defaultValue={suggestion.suggestedName}
                    placeholder="e.g. White Crewneck"
                    required
                    className="w-full border border-[#e8e8e8] bg-white px-3 py-2.5 text-sm placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                      Category
                    </span>
                    <span className="border border-[#e8e8e8] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                      AI: {CATEGORY_LABEL[suggestion.category]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                          category === opt.value
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-[#e8e8e8] text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label
                    className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400"
                    htmlFor="color"
                  >
                    Color
                    <span className="border border-[#e8e8e8] px-2 py-0.5 text-[9px] font-semibold normal-case tracking-normal text-zinc-400">
                      AI: {suggestion.color}
                    </span>
                  </label>
                  <input
                    id="color"
                    name="color"
                    defaultValue={suggestion.color}
                    required
                    className="w-full border border-[#e8e8e8] bg-white px-3 py-2.5 text-sm focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                {/* Hidden fields */}
                <input type="hidden" name="warmthScore" value={suggestion.warmthScore} />
                <input type="hidden" name="pattern" value={suggestion.pattern} />
                <input type="hidden" name="brand" value={suggestion.brand} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-zinc-900 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Add to Closet"}
                </button>
              </>
            )}

            {!suggestion && !analyzing && !preview && (
              <p className="text-center text-[11px] uppercase tracking-[0.1em] text-zinc-400">
                Upload a photo to get started
              </p>
            )}
            {!suggestion && !analyzing && preview && (
              <p className="text-center text-[11px] uppercase tracking-[0.1em] text-zinc-400">
                Analysis failed — tap the photo to try again
              </p>
            )}
          </div>
        </form>

        {/* Items by category */}
        {loading ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            No items yet — add your first piece above.
          </p>
        ) : (
          <div className="space-y-8">
            {byCategory.map((group) => (
              <section key={group.value}>
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  {group.label}
                </h2>
                <div className="grid grid-cols-2 gap-px bg-[#e8e8e8]">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="group relative overflow-hidden bg-white transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <div className="relative h-56 w-full bg-[#f8f8f8]">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-contain p-3"
                        />
                      </div>
                      <div className="border-t border-[#e8e8e8] px-3.5 pb-4 pt-3">
                        <p className="truncate text-base font-medium leading-snug">{item.name}</p>
                        <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                          {CATEGORY_LABEL[item.category]}
                          {item.color ? ` · ${item.color}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={removingId === item.id}
                        className="absolute right-2 top-2 border border-[#e8e8e8] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-30"
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
