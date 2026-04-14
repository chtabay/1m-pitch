"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  user: User | null;
};

const BTN =
  "rounded-lg border border-ink px-3 py-1.5 text-sm font-medium shadow-[2px_2px_0_0_theme(colors.ink)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.ink)] active:translate-y-0 active:shadow-none";

export function AuthButton({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"idle" | "form">("idle");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setInfo("Un email de confirmation a été envoyé.");
    } else {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.refresh();
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:inline">
          {user.user_metadata?.full_name ?? user.email}
        </span>
        <button onClick={handleLogout} className="rounded-lg border border-ink px-3 py-1.5 text-sm transition hover:bg-card">
          Déconnexion
        </button>
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <div className="flex items-center gap-2">
        <button onClick={handleGoogleLogin} className={BTN}>
          Google
        </button>
        <button onClick={() => setMode("form")} className={BTN}>
          Email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailAuth} className="flex flex-col gap-2 rounded-xl border-2 border-ink bg-card p-4 shadow-[4px_4px_0_0_theme(colors.ink)]">
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm font-bold">
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </span>
        <button type="button" onClick={() => { setMode("idle"); setError(""); setInfo(""); }} className="text-xs text-muted hover:text-foreground">
          ✕
        </button>
      </div>

      <input
        type="email"
        placeholder="email@exemple.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-ink bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <input
        type="password"
        placeholder="Mot de passe (6 car. min)"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg border border-ink bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
      {info && <p className="text-xs text-emerald-600">{info}</p>}

      <button type="submit" disabled={loading} className={`${BTN} bg-accent text-zinc-900 disabled:opacity-50`}>
        {loading ? "..." : isSignUp ? "Créer" : "Connexion"}
      </button>

      <button
        type="button"
        onClick={() => { setIsSignUp(!isSignUp); setError(""); setInfo(""); }}
        className="text-xs text-muted underline hover:text-foreground"
      >
        {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer"}
      </button>
    </form>
  );
}
