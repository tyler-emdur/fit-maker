"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Category, ClothingItem } from "@/lib/types";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "shirt", label: "Shirt" },
  { value: "top", label: "Outer Layer" },
  { value: "bottom", label: "Bottom" },
  { value: "shoes", label: "Shoes" },
];

const SEASON_OPTIONS = [
  { value: "all", label: "All Seasons" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

const STYLE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "smart casual", label: "Smart Casual" },
  { value: "formal", label: "Formal" },
  { value: "athletic", label: "Athletic" },
  { value: "streetwear", label: "Streetwear" },
  { value: "boots", label: "Boots" },
];

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<Category>("shirt");
  const [warmth, setWarmth] = useState(5);
  const [preview, setPreview] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refreshItems() {
    const response = await fetch("/api/items");
    const payload = (await response.json()) as { items: ClothingItem[] };
    setItems((payload.items ?? []).filter((i) => i.active));
    setLoading(false);
  }

  useEffect(() => {
    refreshItems();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("category", category);
    data.set("warmthScore", String(warmth));
    setSubmitting(true);
    const response = await fetch("/api/items", { method: "POST", body: data });
    if (response.ok) {
      form.reset();
      setCategory("shirt");
      setWarmth(5);
      setPreview(null);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Closet</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your wardrobe.</p>
        </div>
        <a href="/" className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50 transition-colors">
          ← Home
        </a>
      </div>

      {/* Add Item Form */}
      <form onSubmit={submit} className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Add a new item</h2>

        {/* Name */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. White Oxford Shirt"
            required
          />
        </div>

        {/* Category */}
        <div className="mt-4">
          <span className="block text-sm font-medium mb-2">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  category === opt.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="color">
              Color
            </label>
            <input
              id="color"
              name="color"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g. Navy Blue"
              required
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="style">
              Style
            </label>
            <select
              id="style"
              name="style"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="season">
              Season
            </label>
            <select
              id="season"
              name="season"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            >
              {SEASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Warmth */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Warmth{" "}
              <span className="font-normal text-zinc-500">
                {warmth === 1
                  ? "Very light"
                  : warmth <= 3
                    ? "Light"
                    : warmth <= 5
                      ? "Medium"
                      : warmth <= 7
                        ? "Warm"
                        : "Very warm"}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={warmth}
              onChange={(e) => setWarmth(Number(e.target.value))}
              className="w-full accent-black"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-0.5">
              <span>Light</span>
              <span>Warm</span>
            </div>
          </div>
        </div>

        {/* Photo upload */}
        <div className="mt-4">
          <span className="block text-sm font-medium mb-2">Photo</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-zinc-200 p-6 text-center hover:border-zinc-400 transition-colors focus:outline-none"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-40 object-contain rounded-lg"
              />
            ) : (
              <>
                <p className="text-sm text-zinc-500">Click to upload a photo</p>
                <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-zinc-800 transition-colors"
        >
          {submitting ? "Uploading..." : "Add to Closet"}
        </button>
      </form>

      {/* Items grid */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Your items{!loading && ` (${items.length})`}
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No items yet. Add your first piece above.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="group relative rounded-xl border bg-white p-3 shadow-sm">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={320}
                  height={160}
                  unoptimized
                  className="h-40 w-full rounded-lg object-cover"
                />
                <div className="mt-2">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                    {item.category} · {item.color} · {item.style}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={removingId === item.id}
                  className="absolute top-2 right-2 rounded-full bg-white border px-2 py-0.5 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50"
                >
                  {removingId === item.id ? "..." : "Remove"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
