import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * POST /api/groups/create
 * Create group + add creator as admin. Uses service role to bypass RLS.
 */
export async function POST(request: Request) {
  const { name, memberId } = await request.json();

  if (!name?.trim() || !memberId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userSupabase = await createServerSupabase();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 });
  }
  const admin = createClient(url, key);

  const { data: group, error } = await admin
    .from("groups")
    .insert({ name: name.trim(), created_by: memberId })
    .select()
    .single();

  if (error || !group) {
    return NextResponse.json({ error: "Lỗi tạo nhóm" }, { status: 500 });
  }

  await admin.from("group_members").insert({
    group_id: group.id,
    member_id: memberId,
    role: "admin",
  });

  return NextResponse.json({ group });
}
