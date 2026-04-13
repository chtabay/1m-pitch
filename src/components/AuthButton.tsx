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
          className="rounded-lg border border-ink px-3 py-1.5 text-sm transition hover:bg-card"
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
        className="rounded-lg border border-ink px-3 py-1.5 text-sm font-medium shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
      >
        Google
      </button>
      <button
        onClick={() => handleLogin("github")}
        className="rounded-lg border border-ink px-3 py-1.5 text-sm font-medium shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
      >
        GitHub
      </button>
      <button
        onClick={() => handleLogin("discord")}
        className="rounded-lg border border-ink px-3 py-1.5 text-sm font-medium shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none"
      >
        Discord
      </button>
    </div>
  );
}
