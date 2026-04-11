import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * POST /api/groups/join
 * Join a group by invite code. Uses service role to bypass RLS on groups table.
 */
export async function POST(request: Request) {
  const { inviteCode, memberId } = await request.json();

  if (!inviteCode || !memberId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify the requesting user is authenticated
  const userSupabase = await createServerSupabase();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to find group by invite code (bypasses RLS)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 });
  }
  const admin = createClient(url, key);

  const { data: group } = await admin
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode.trim().toLowerCase())
    .single();

  if (!group) {
    return NextResponse.json({ error: "Mã mời không hợp lệ" }, { status: 404 });
  }

  // Check if already member
  const { data: existing } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Đã trong nhóm", group });
  }

  // Add to group
  await admin.from("group_members").insert({
    group_id: group.id,
    member_id: memberId,
    role: "member",
  });

  return NextResponse.json({ message: "Đã tham gia", group });
}
