import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { isOwnerRequest } from "@/lib/verifyOwner";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const clientId = params.id;

  const [profile, subscription, transactions, tasks] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, created_at, is_active").eq("id", clientId).single(),
    supabase.from("subscriptions").select("*, company_packages(name, price)").eq("user_id", clientId).eq("role", "company").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("transactions").select("*").eq("user_id", clientId).order("created_at", { ascending: false }).limit(100),
    supabase.from("tasks").select("id, platform, target_url, status, created_at, deadline").eq("company_id", clientId).order("created_at", { ascending: false }).limit(100),
  ]);

  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });

  return NextResponse.json({
    profile: profile.data,
    subscription: subscription.data,
    transactions: transactions.data || [],
    tasks: tasks.data || [],
  });
}
