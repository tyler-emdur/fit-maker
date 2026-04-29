"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Category, ClothingItem } from "@/lib/types";

const categoryOptions: Category[] = ["shirt", "top", "bottom", "shoes"];

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function refreshItems() {
    const response = await fetch("/api/items");
    const payload = (await response.json()) as { items: ClothingItem[] };
    setItems(payload.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/items")
      .then((response) => response.json() as Promise<{ items: ClothingItem[] }>)
      .then((payload) => {
        setItems(payload.items ?? []);
        setLoading(false);
      });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    const response = await fetch("/api/items", { method: "POST", body: data });
    if (response.ok) {
      form.reset();
      await refreshItems();
    }
    setSubmitting(false);
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Closet</h1>
      <p className="mt-2 text-sm text-zinc-500">Upload and tag every piece once.</p>

      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border p-4 md:grid-cols-2">
        <input className="rounded border px-3 py-2" name="name" placeholder="Name" required />
        <select className="rounded border px-3 py-2" name="category" defaultValue="shirt">
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          className="rounded border px-3 py-2"
          name="warmthScore"
          type="number"
          min={1}
          max={10}
          defaultValue={5}
          required
        />
        <input className="rounded border px-3 py-2" name="color" placeholder="Color" required />
        <input className="rounded border px-3 py-2" name="style" placeholder="Style" required />
        <input className="rounded border px-3 py-2" name="season" placeholder="Season" required />
        <input className="rounded border px-3 py-2 md:col-span-2" name="file" type="file" accept="image/*" required />
        <button
          className="rounded bg-black px-4 py-2 text-sm text-white md:col-span-2 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Uploading..." : "Add Item"}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Current items</h2>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Loading...</p> : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border p-3">
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={320}
                height={160}
                unoptimized
                className="h-40 w-full rounded object-cover"
              />
              <p className="mt-2 font-medium">{item.name}</p>
              <p className="text-xs text-zinc-500">
                {item.category} · {item.color} · {item.style}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

