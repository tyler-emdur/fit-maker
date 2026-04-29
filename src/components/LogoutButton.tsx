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
    <button className="rounded-md border px-3 py-1 text-sm" onClick={logout} type="button">
      Log out
    </button>
  );
}

