"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ClaimResult = { ok: boolean; amount?: number; balance?: number; streak?: number; message?: string };

export async function claimQuest(key: string): Promise<ClaimResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_quest", { p_key: key });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/quests");
  revalidatePath("/", "layout");
  return data as ClaimResult;
}

export async function claimDailyBonus(): Promise<ClaimResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_daily_bonus");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/quests");
  revalidatePath("/", "layout");
  return data as ClaimResult;
}
