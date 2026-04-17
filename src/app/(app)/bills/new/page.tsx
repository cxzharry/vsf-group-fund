"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { formatVND, parseVND } from "@/lib/format-vnd";
import { toast } from "sonner";
import type { Member } from "@/lib/types";

export default function NewBillPage() {
  const { member } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("group");
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [title, setTitle] = useState("");
  const [totalInput, setTotalInput] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = parseVND(totalInput);

  useEffect(() => {
    async function load() {
      if (groupId) {
        const { data: gName } = await supabase
          .from("groups").select("name").eq("id", groupId).single();
        if (gName) setGroupName(gName.name);

        const { data: gm } = await supabase
          .from("group_members").select("member_id").eq("group_id", groupId);

        if (gm?.length) {
          const ids = gm.map((m) => m.member_id);
          const { data } = await supabase
            .from("members").select("*").in("id", ids).order("display_name");
          if (data) setMembers(data);
        }
      } else {
        const { data } = await supabase
          .from("members").select("*").order("display_name");
        if (data) setMembers(data);
      }
      if (member) setPaidBy(member.id);
    }
    load();
  }, [supabase, member, groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  }

  function getEqualSplitAmounts(): Record<string, number> {
    const count = selectedMembers.size;
    if (count === 0 || totalAmount === 0) return {};
    const base = Math.floor(totalAmount / count);
    const remainder = totalAmount - base * count;
    const amounts: Record<string, number> = {};
    let i = 0;
    for (const id of selectedMembers) {
      amounts[id] = base + (i < remainder ? 1 : 0);
      i++;
    }
    return amounts;
  }

  function getCustomTotal(): number {
    return Array.from(selectedMembers).reduce(
      (sum, id) => sum + parseVND(customAmounts[id] ?? "0"), 0
    );
  }

  async function handleSubmit() {
    if (!title.trim()) return toast.error("Nhập tên hóa đơn");
    if (totalAmount <= 0) return toast.error("Nhập số tiền");
    if (!paidBy) return toast.error("Chọn người trả");
    if (selectedMembers.size === 0) return toast.error("Chọn người tham gia");

    const amounts =
      splitType === "equal"
        ? getEqualSplitAmounts()
        : Object.fromEntries(
            Array.from(selectedMembers).map((id) => [id, parseVND(customAmounts[id] ?? "0")])
          );

    if (splitType === "custom") {
      const customTotal = getCustomTotal();
      if (customTotal !== totalAmount) {
        return toast.error(
          `Tổng custom (${formatVND(customTotal)}) khác tổng bill (${formatVND(totalAmount)})`
        );
      }
    }

    setSubmitting(true);

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        title: title.trim(),
        total_amount: totalAmount,
        paid_by: paidBy,
        split_type: splitType,
        group_id: groupId || null,
        created_by: member!.id,
      })
      .select().single();

    if (billError || !bill) {
      setSubmitting(false);
      return toast.error("Lỗi tạo hóa đơn");
    }

    const participants = Array.from(selectedMembers).map((memberId) => ({
      bill_id: bill.id, member_id: memberId, amount: amounts[memberId] ?? 0,
    }));
    const { error: partError } = await supabase.from("bill_participants").insert(participants);
    if (partError) { setSubmitting(false); return toast.error("Lỗi thêm người tham gia"); }

    const debts = Array.from(selectedMembers)
      .filter((id) => id !== paidBy)
      .map((debtorId) => ({
        bill_id: bill.id, debtor_id: debtorId, creditor_id: paidBy,
        amount: amounts[debtorId] ?? 0, remaining: amounts[debtorId] ?? 0,
        status: "pending" as const,
      }));

    if (debts.length > 0) {
      const { error: debtError } = await supabase.from("debts").insert(debts);
      if (debtError) { setSubmitting(false); return toast.error("Lỗi tạo khoản nợ"); }
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_bill",
        payload: { billId: bill.id, billTitle: title.trim(), totalAmount, paidById: paidBy },
      }),
    }).catch(() => {});

    toast.success("Đã tạo hóa đơn!");
    router.push(groupId ? `/groups/${groupId}` : "/bills");
  }

  const equalAmounts = getEqualSplitAmounts();
  const perPerson = selectedMembers.size > 0 && totalAmount > 0
    ? Math.floor(totalAmount / selectedMembers.size)
    : 0;

  return (
    <>
      <PageHeader title={groupName ? `Tạo bill — ${groupName}` : "Tạo hóa đơn"} />

      <main className="space-y-3 bg-[#F2F2F7] px-4 py-4 pb-8">

        {/* Amount — large centered input */}
        <div className="rounded-[14px] bg-white px-4 py-5 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
            Số tiền
          </p>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              value={totalInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setTotalInput(raw ? formatVND(parseInt(raw)) : "");
              }}
              placeholder="0"
              className="w-full bg-transparent text-3xl font-bold text-[#1C1C1E] outline-none placeholder-[#C7C7CC]"
            />
            <span className="ml-1 text-xl font-semibold text-[#8E8E93]">đ</span>
          </div>
          {perPerson > 0 && (
            <p className="mt-2 text-sm text-[#8E8E93]">
              {selectedMembers.size} người · {formatVND(perPerson)}đ/người
            </p>
          )}
        </div>

        {/* Title */}
        <div className="overflow-hidden rounded-[14px] bg-white shadow-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tên hóa đơn (VD: Cơm trưa)"
            className="w-full px-4 py-4 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
          />
        </div>

        {/* Split type chips */}
        <div className="rounded-[14px] bg-white px-4 py-3 shadow-sm">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
            Cách chia
          </p>
          <div className="flex gap-2">
            {(["equal", "custom"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  splitType === type
                    ? "bg-[#3A5CCC] text-white"
                    : "bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA]"
                }`}
              >
                {type === "equal" ? "Chia đều" : "Tuỳ chỉnh"}
              </button>
            ))}
          </div>
          {splitType === "custom" && selectedMembers.size > 0 && (
            <p className="mt-2 text-xs text-[#8E8E93]">
              Đã nhập: {formatVND(getCustomTotal())}đ / {formatVND(totalAmount)}đ
            </p>
          )}
        </div>

        {/* Who paid */}
        <div className="rounded-[14px] bg-white px-4 py-3 shadow-sm">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
            Ai trả tiền?
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaidBy(m.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  paidBy === m.id
                    ? "bg-[#3A5CCC] text-white"
                    : "bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA]"
                }`}
              >
                {m.display_name}
              </button>
            ))}
          </div>
        </div>

        {/* Who participated */}
        <div className="rounded-[14px] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
              Ai tham gia?
            </p>
            <button
              type="button"
              onClick={selectAll}
              className="text-sm font-medium text-[#3A5CCC]"
            >
              {selectedMembers.size === members.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
          <div className="divide-y divide-[#F2F2F7]">
            {members.map((m) => {
              const selected = selectedMembers.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors ${
                    selected ? "bg-[#EEF2FF]" : "hover:bg-[#F9F9FB]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox indicator */}
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selected ? "border-[#3A5CCC] bg-[#3A5CCC]" : "border-[#C7C7CC]"
                    }`}>
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5L8.5 2" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[15px] text-[#1C1C1E]">{m.display_name}</span>
                  </div>

                  {selected && splitType === "equal" && totalAmount > 0 && (
                    <span className="text-sm font-medium text-[#3A5CCC]">
                      {formatVND(equalAmounts[m.id] ?? 0)}đ
                    </span>
                  )}
                  {selected && splitType === "custom" && (
                    <input
                      value={customAmounts[m.id] ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setCustomAmounts((prev) => ({
                          ...prev,
                          [m.id]: raw ? formatVND(parseInt(raw)) : "",
                        }));
                      }}
                      className="ml-2 h-8 w-28 rounded-lg border border-[#E5E5EA] bg-white px-2 text-right text-sm outline-none focus:border-[#3A5CCC]"
                      placeholder="Số tiền"
                      inputMode="numeric"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit — primary CTA: h-[54px] rounded-[14px] text-[17px] per components.md §1 Button.lg */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || totalAmount <= 0 || !title.trim() || selectedMembers.size === 0}
          className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#3A5CCC] text-[17px] font-semibold text-white shadow transition-opacity disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? "Đang tạo..." : "Tạo hóa đơn"}
        </button>
      </main>
    </>
  );
}
