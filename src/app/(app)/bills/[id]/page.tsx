"use client";

// US-E3-4: Deep-link fallback — redirect to group page with ?billDetail=<id>
// so the BillDetailsSheet opens there rather than rendering a standalone page.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function BillDetailRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function redirect() {
      const { data: bill } = await supabase
        .from("bills")
        .select("group_id")
        .eq("id", id)
        .single();

      if (bill?.group_id) {
        router.replace(`/groups/${bill.group_id}?billDetail=${id}`);
      } else {
        // Fallback: go to groups list if bill not found
        router.replace("/groups");
      }
    }
    redirect();
  }, [id, router, supabase]);

  return (
    <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
    </div>
  );
}
