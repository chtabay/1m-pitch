"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

export function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/");
    });
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder="Rechercher…"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch(e.currentTarget.value);
        }}
        className="w-full rounded-full border border-zinc-300 bg-background px-4 py-2 pl-10 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-zinc-700"
      />
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
        ⌕
      </span>
      {isPending && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted animate-pulse">
          …
        </span>
      )}
    </div>
  );
}
