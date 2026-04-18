"use client";

// Multi-hop debt simplification view.
// Shows the minimum set of transfers to settle all debts in this group.
// Does NOT modify underlying debts — this is a display-only "settle-up" plan.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { formatVND } from "@/lib/format-vnd";
import { simplifyDebts, transfersForMember } from "@/lib/debt-simplifier";
import type { Member, Group } from "@/lib/types";

export default function SettlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member: currentMember } = useAuth();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [debts, setDebts] = useState<Array<{ debtor_id: string; creditor_id: string; remaining: number }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [groupRes, gmRes, debtRes] = await Promise.all([
      supabase.from("groups").select("*").eq("id", id).single(),
      supabase.from("group_members").select("member_id").eq("group_id", id),
      supabase
        .from("debts")
        .select("debtor_id, creditor_id, remaining, bills!inner(group_id)")
        .eq("bills.group_id", id)
        .in("status", ["pending", "partial"]),
    ]);

    setGroup(groupRes.data);
    const memberIds = (gmRes.data ?? []).map((m: { member_id: string }) => m.member_id);
    if (memberIds.length > 0) {
      const { data: mData } = await supabase.from("members").select("*").in("id", memberIds);
      const map: Record<string, Member> = {};
      (mData ?? []).forEach((m: Member) => (map[m.id] = m));
      setMembers(map);
    }
    setDebts(
      (debtRes.data ?? []).map((d: { debtor_id: string; creditor_id: string; remaining: number }) => ({
        debtor_id: d.debtor_id,
        creditor_id: d.creditor_id,
        remaining: d.remaining,
      }))
    );
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const simplified = useMemo(() => simplifyDebts(debts), [debts]);
  const myTransfers = useMemo(
    () => (currentMember ? transfersForMember(simplified, currentMember.id) : { outgoing: [], incoming: [] }),
    [simplified, currentMember]
  );

  const originalCount = debts.filter((d) => d.remaining > 0).length;
  const simplifiedCount = simplified.length;

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A5CCC] border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#F2F2F7]">
        <p className="text-sm text-[#AEAEB2]">Không tìm thấy nhóm</p>
      </div>
    );
  }

  const memberName = (mid: string) => members[mid]?.display_name ?? "?";
  const initials = (mid: string) =>
    (members[mid]?.display_name ?? "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar */}
      <header className="flex h-[52px] shrink-0 items-center justify-between bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#636366] hover:bg-[#F2F2F7]"
          aria-label="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold text-[#1C1C1E]">Gợi ý tất toán</p>
          <p className="text-[11px] text-[#AEAEB2]">{group.name}</p>
        </div>
        <div className="h-8 w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-[#8E8E93]">Tối ưu multi-hop</p>
          <p className="mt-1 text-sm text-[#1C1C1E]">
            <span className="font-semibold">{simplifiedCount}</span> giao dịch để tất toán nhóm{" "}
            {originalCount > simplifiedCount && (
              <span className="text-[#34C759]">
                (giảm từ {originalCount} nợ trực tiếp)
              </span>
            )}
          </p>
          <p className="mt-2 text-[11px] text-[#AEAEB2]">
            Thuật toán net ròng theo đồ thị, nhảy qua trung gian. Nếu ai cũng chuyển đúng theo gợi ý, toàn bộ nợ trong nhóm sẽ cân bằng.
          </p>
        </div>

        {/* User's outgoing (needs to pay) */}
        {myTransfers.outgoing.length > 0 && (
          <section>
            <p className="mb-2 px-1 text-xs font-semibold uppercase text-[#8E8E93]">
              Bạn cần chuyển
            </p>
            <div className="space-y-2">
              {myTransfers.outgoing.map((t, i) => (
                <div
                  key={`out-${i}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3F0] text-sm font-bold text-[#FF3B30]">
                      {initials(t.to)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1C1E]">{memberName(t.to)}</p>
                      <p className="text-[11px] text-[#AEAEB2]">Chuyển trực tiếp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#FF3B30]">
                      {formatVND(t.amount)}đ
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/transfer/creditor/${t.to}?group=${id}`)}
                      className="rounded-full bg-[#3A5CCC] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Trả
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User's incoming (will be paid) */}
        {myTransfers.incoming.length > 0 && (
          <section>
            <p className="mb-2 px-1 text-xs font-semibold uppercase text-[#8E8E93]">
              Sẽ nhận từ
            </p>
            <div className="space-y-2">
              {myTransfers.incoming.map((t, i) => (
                <div
                  key={`in-${i}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FFF4] text-sm font-bold text-[#34C759]">
                      {initials(t.from)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1C1E]">{memberName(t.from)}</p>
                      <p className="text-[11px] text-[#AEAEB2]">Sẽ chuyển cho bạn</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold text-[#34C759]">
                    +{formatVND(t.amount)}đ
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All group transfers */}
        <section>
          <p className="mb-2 px-1 text-xs font-semibold uppercase text-[#8E8E93]">
            Toàn bộ gợi ý ({simplifiedCount})
          </p>
          {simplified.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-[#8E8E93]">Nhóm đã tất toán — không còn nợ nào.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {simplified.map((t, i) => (
                <div
                  key={`all-${i}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="flex flex-1 items-center gap-2 text-sm text-[#1C1C1E]">
                    <span className="font-medium">{memberName(t.from)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={2}>
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-medium">{memberName(t.to)}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1C1C1E]">
                    {formatVND(t.amount)}đ
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Note */}
        <div className="rounded-2xl bg-[#FFF9E6] p-3 text-[11px] leading-relaxed text-[#8A6D1F]">
          <p className="font-semibold">⚠️ Lưu ý</p>
          <p className="mt-1">
            Khi bạn bấm <b>Trả</b>, hệ thống đóng các nợ trực tiếp với người nhận (pair-net). Số tiền thực tế có thể khác số gợi ý nếu bạn có nợ qua trung gian — phần chênh giữ nguyên đến khi trung gian tất toán.
          </p>
        </div>
      </div>
    </div>
  );
}
