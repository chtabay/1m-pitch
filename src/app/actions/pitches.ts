"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function invest(pitchId: string, amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };
  if (amount < 10000) return { error: "Minimum $10,000" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.balance < amount) {
    return { error: "Solde insuffisant" };
  }

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("pitch_id", pitchId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (existing) return { error: "Déjà investi" };

  const { data: pitchData } = await supabase
    .from("pitches")
    .select("status")
    .eq("id", pitchId)
    .single();

  if (pitchData?.status !== "open") return { error: "Investissement clos" };

  const { error: voteError } = await supabase
    .from("votes")
    .insert({ pitch_id: pitchId, voter_id: user.id, amount });

  if (voteError) return { error: voteError.message };

  await supabase
    .from("profiles")
    .update({ balance: profile.balance - amount })
    .eq("id", user.id);

  revalidatePath("/");
  return { error: null };
}

export async function withdrawVote(pitchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: vote } = await supabase
    .from("votes")
    .select("id, amount")
    .eq("pitch_id", pitchId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (!vote) return;

  const { data: pitchCheck } = await supabase
    .from("pitches")
    .select("status")
    .eq("id", pitchId)
    .single();

  if (pitchCheck?.status !== "open") return;

  await supabase.from("votes").delete().eq("id", vote.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ balance: profile.balance + vote.amount })
      .eq("id", user.id);
  }

  revalidatePath("/");
}

export async function updatePitch(pitchId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const title = (formData.get("title") as string)?.trim();
  const oneLiner = (formData.get("one_liner") as string)?.trim();
  const kind = (formData.get("kind") as string) || "film";

  if (!title || !oneLiner) return;

  await supabase
    .from("pitches")
    .update({ title, one_liner: oneLiner, kind, updated_at: new Date().toISOString() })
    .eq("id", pitchId)
    .eq("author_id", user.id);

  revalidatePath("/");
  redirect("/");
}

export async function submitPoc(pitchId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, author_id, status")
    .eq("id", pitchId)
    .single();

  if (!pitch || pitch.author_id !== user.id) redirect("/");
  if (pitch.status !== "open" && pitch.status !== "rejected") {
    redirect(`/pitch/${pitchId}`);
  }

  const pocUrl = (formData.get("poc_url") as string)?.trim() || null;
  const deckUrl = (formData.get("deck_url") as string)?.trim() || null;
  const pocDescription = (formData.get("poc_description") as string)?.trim() || null;

  const files = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f.size > 0 && f.size < 5_000_000);

  for (const file of validFiles) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${pitchId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("poc-images")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      await supabase
        .from("poc_images")
        .insert({ pitch_id: pitchId, storage_path: path });
    }
  }

  if (pitch.status === "rejected") {
    await supabase
      .from("poc_validations")
      .delete()
      .eq("pitch_id", pitchId);
  }

  await supabase
    .from("pitches")
    .update({
      status: "poc_submitted",
      poc_url: pocUrl,
      deck_url: deckUrl,
      poc_description: pocDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pitchId);

  revalidatePath("/");
  redirect(`/pitch/${pitchId}`);
}

export async function validatePoc(
  pitchId: string,
  approved: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: vote } = await supabase
    .from("votes")
    .select("id")
    .eq("pitch_id", pitchId)
    .eq("voter_id", user.id)
    .maybeSingle();

  if (!vote) return;

  await supabase
    .from("poc_validations")
    .upsert(
      { pitch_id: pitchId, voter_id: user.id, approved },
      { onConflict: "pitch_id,voter_id" },
    );

  const { data: validations } = await supabase
    .from("poc_validations")
    .select("approved")
    .eq("pitch_id", pitchId);

  const { data: investors } = await supabase
    .from("votes")
    .select("id")
    .eq("pitch_id", pitchId);

  const totalInvestors = (investors ?? []).length;
  const approvals = (validations ?? []).filter((v) => v.approved).length;
  const rejections = (validations ?? []).filter((v) => !v.approved).length;

  const majority = Math.ceil(totalInvestors / 2);

  if (approvals >= majority) {
    await supabase
      .from("pitches")
      .update({ status: "validated" })
      .eq("id", pitchId);
  } else if (rejections >= majority) {
    await supabase
      .from("pitches")
      .update({ status: "rejected" })
      .eq("id", pitchId);
  }

  revalidatePath(`/pitch/${pitchId}`);
  revalidatePath("/");
}

export async function createPitch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const title = (formData.get("title") as string)?.trim();
  const oneLiner = (formData.get("one_liner") as string)?.trim();
  const kind = (formData.get("kind") as string) || "film";

  if (!title || !oneLiner) return;

  await supabase.from("pitches").insert({
    author_id: user.id,
    title,
    one_liner: oneLiner,
    kind,
    depth: 0,
  });

  revalidatePath("/");
  redirect("/");
}

export async function createIdea(parentId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: parent } = await supabase
    .from("pitches")
    .select("id, depth, kind, author_id")
    .eq("id", parentId)
    .single();

  if (!parent || parent.depth >= 2) redirect("/");

  const isInvestor = !!(
    await supabase
      .from("votes")
      .select("id")
      .eq("pitch_id", parentId)
      .eq("voter_id", user.id)
      .maybeSingle()
  ).data;

  const isAuthor = parent.author_id === user.id;

  if (!isInvestor && !isAuthor) redirect(`/pitch/${parentId}`);

  const title = (formData.get("title") as string)?.trim();
  const oneLiner = (formData.get("one_liner") as string)?.trim();

  if (!title || !oneLiner) return;

  const newDepth = parent.depth + 1;

  const { data: created } = await supabase
    .from("pitches")
    .insert({
      author_id: user.id,
      parent_id: parentId,
      depth: newDepth,
      title,
      one_liner: oneLiner,
      kind: parent.kind,
    })
    .select("id")
    .single();

  revalidatePath(`/pitch/${parentId}`);
  if (created) redirect(`/pitch/${created.id}`);
  redirect(`/pitch/${parentId}`);
}

export async function updateResources(pitchId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, author_id, depth")
    .eq("id", pitchId)
    .single();

  if (!pitch || pitch.author_id !== user.id || pitch.depth === 0) {
    redirect(`/pitch/${pitchId}`);
  }

  const pocUrl = (formData.get("poc_url") as string)?.trim() || null;
  const pocDescription = (formData.get("poc_description") as string)?.trim() || null;

  const files = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f.size > 0 && f.size < 5_000_000);

  for (const file of validFiles) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${pitchId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("poc-images")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      await supabase
        .from("poc_images")
        .insert({ pitch_id: pitchId, storage_path: path });
    }
  }

  await supabase
    .from("pitches")
    .update({
      poc_url: pocUrl,
      poc_description: pocDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pitchId);

  revalidatePath(`/pitch/${pitchId}`);
  redirect(`/pitch/${pitchId}`);
}

export async function postMessage(pitchId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: pitch } = await supabase
    .from("pitches")
    .select("id, depth")
    .eq("id", pitchId)
    .single();

  if (!pitch || pitch.depth !== 2) return;

  const content = (formData.get("content") as string)?.trim();
  if (!content) return;

  await supabase
    .from("messages")
    .insert({ pitch_id: pitchId, author_id: user.id, content });

  revalidatePath(`/pitch/${pitchId}`);
}
