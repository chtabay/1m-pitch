import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    },
  );
}

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getUserBalance = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();
  return data?.balance ?? 0;
});

import type { QuestsState } from "@/lib/game";

/** Server-computed gamification state for the signed-in user (cached per request). */
export const getQuestsState = cache(async (): Promise<QuestsState | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_quests_state");
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as QuestsState;
});
