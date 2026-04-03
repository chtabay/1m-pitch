"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type Props = {
  user: User | null;
};

export function AuthButton({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (provider: "google" | "github" | "discord") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:inline">
          {user.user_metadata?.full_name ?? user.email}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLogin("google")}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Google
      </button>
      <button
        onClick={() => handleLogin("github")}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        GitHub
      </button>
      <button
        onClick={() => handleLogin("discord")}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Discord
      </button>
    </div>
  );
}
