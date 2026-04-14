import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(origin);
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "email" | "recovery" | undefined;
  if (tokenHash && type) {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return NextResponse.redirect(origin);
  }

  return NextResponse.redirect(origin);
}
