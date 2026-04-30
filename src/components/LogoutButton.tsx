"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline"
      onClick={logout}
      type="button"
    >
      Log out
    </button>
  );
}
