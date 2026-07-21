import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { isOwnerRequest } from "@/lib/verifyOwner";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const commenterId = params.id;

  const [profile, subscription, transactions, submissions, withdrawals] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, created_at, is_active").eq("id", commenterId).single(),
    supabase.from("subscriptions").select("*, commenter_packages(name, price, commission_per_task)").eq("user_id", commenterId).eq("role", "commenter").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("transactions").select("*").eq("user_id", commenterId).order("created_at", { ascending: false }).limit(100),
    supabase.from("task_submissions").select("id, review_status, submitted_at, tasks(platform, target_url)").eq("commenter_id", commenterId).order("submitted_at", { ascending: false }).limit(100),
    supabase.from("withdrawals").select("*").eq("commenter_id", commenterId).order("requested_at", { ascending: false }).limit(100),
  ]);

  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });

  return NextResponse.json({
    profile: profile.data,
    subscription: subscription.data,
    transactions: transactions.data || [],
    submissions: submissions.data || [],
    withdrawals: withdrawals.data || [],
  });
}
