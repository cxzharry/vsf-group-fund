"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        // Load only group members
        const { data: gName } = await supabase
          .from("groups")
          .select("name")
          .eq("id", groupId)
          .single();
        if (gName) setGroupName(gName.name);

        const { data: gm } = await supabase
          .from("group_members")
          .select("member_id")
          .eq("group_id", groupId);

        if (gm?.length) {
          const ids = gm.map((m) => m.member_id);
          const { data } = await supabase
            .from("members")
            .select("*")
            .in("id", ids)
            .order("display_name");
          if (data) setMembers(data);
        }
      } else {
        // Load all members
        const { data } = await supabase
          .from("members")
          .select("*")
          .order("display_name");
        if (data) setMembers(data);
      }
      if (member) setPaidBy(member.id);
    }
    load();
  }, [supabase, member, groupId]);

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  // Calculate equal split with integer rounding
  function getEqualSplitAmounts(): Record<string, number> {
    const count = selectedMembers.size;
    if (count === 0 || totalAmount === 0) return {};

    const base = Math.floor(totalAmount / count);
    const remainder = totalAmount - base * count;
    const amounts: Record<string, number> = {};
    let i = 0;

    for (const id of selectedMembers) {
      // First N people pay 1 more to cover rounding remainder
      amounts[id] = base + (i < remainder ? 1 : 0);
      i++;
    }
    return amounts;
  }

  function getCustomTotal(): number {
    return Array.from(selectedMembers).reduce(
      (sum, id) => sum + parseVND(customAmounts[id] ?? "0"),
      0
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
            Array.from(selectedMembers).map((id) => [
              id,
              parseVND(customAmounts[id] ?? "0"),
            ])
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

    // Create bill
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
      .select()
      .single();

    if (billError || !bill) {
      setSubmitting(false);
      return toast.error("Lỗi tạo hóa đơn");
    }

    // Create participants
    const participants = Array.from(selectedMembers).map((memberId) => ({
      bill_id: bill.id,
      member_id: memberId,
      amount: amounts[memberId] ?? 0,
    }));

    const { error: partError } = await supabase
      .from("bill_participants")
      .insert(participants);

    if (partError) {
      setSubmitting(false);
      return toast.error("Lỗi thêm người tham gia");
    }

    // Create debt records (everyone except the payer owes the payer)
    const debts = Array.from(selectedMembers)
      .filter((id) => id !== paidBy)
      .map((debtorId) => ({
        bill_id: bill.id,
        debtor_id: debtorId,
        creditor_id: paidBy,
        amount: amounts[debtorId] ?? 0,
        remaining: amounts[debtorId] ?? 0,
        status: "pending" as const,
      }));

    if (debts.length > 0) {
      const { error: debtError } = await supabase.from("debts").insert(debts);
      if (debtError) {
        setSubmitting(false);
        return toast.error("Lỗi tạo khoản nợ");
      }
    }

    // Send Telegram notifications (fire-and-forget)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_bill",
        payload: {
          billId: bill.id,
          billTitle: title.trim(),
          totalAmount,
          paidById: paidBy,
        },
      }),
    }).catch(() => {}); // Don't block on notification failure

    toast.success("Đã tạo hóa đơn!");
    router.push(groupId ? `/groups/${groupId}` : "/");
  }

  const equalAmounts = getEqualSplitAmounts();

  return (
    <>
      <MobileHeader title={groupName ? `Tạo bill — ${groupName}` : "Tạo hóa đơn"} />
      <main className="space-y-4 p-4">
        {/* Bill info */}
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Tên hóa đơn</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cơm trưa 11/4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="total">Tổng tiền (VND)</Label>
              <Input
                id="total"
                value={totalInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setTotalInput(raw ? formatVND(parseInt(raw)) : "");
                }}
                placeholder="VD: 500.000"
                inputMode="numeric"
              />
            </div>
          </CardContent>
        </Card>

        {/* Who paid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ai trả tiền?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    paidBy === m.id
                      ? "border-[#3A5CCC] bg-[#EEF2FF] text-[#3A5CCC]"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Who ate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Ai ăn?</CardTitle>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-[#3A5CCC]"
              >
                {selectedMembers.size === members.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {members.map((m) => {
                const selected = selectedMembers.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "border-[#3A5CCC] bg-[#EEF2FF]"
                        : "hover:border-foreground/20"
                    }`}
                  >
                    <span>{m.display_name}</span>
                    {selected && splitType === "equal" && totalAmount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {formatVND(equalAmounts[m.id] ?? 0)}đ
                      </span>
                    )}
                    {selected && splitType === "custom" && (
                      <Input
                        value={customAmounts[m.id] ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          setCustomAmounts((prev) => ({
                            ...prev,
                            [m.id]: raw ? formatVND(parseInt(raw)) : "",
                          }));
                        }}
                        className="ml-2 h-7 w-28 text-right text-xs"
                        placeholder="Số tiền"
                        inputMode="numeric"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Split type */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={splitType === "equal" ? "default" : "outline"}
                className={splitType === "equal" ? "bg-[#3A5CCC] hover:bg-[#2d4aaa]" : ""}
                size="sm"
                onClick={() => setSplitType("equal")}
              >
                Chia đều
              </Button>
              <Button
                type="button"
                variant={splitType === "custom" ? "default" : "outline"}
                className={splitType === "custom" ? "bg-[#3A5CCC] hover:bg-[#2d4aaa]" : ""}
                size="sm"
                onClick={() => setSplitType("custom")}
              >
                Tùy chỉnh
              </Button>
            </div>
            {splitType === "custom" && selectedMembers.size > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Đã nhập: {formatVND(getCustomTotal())}đ / {formatVND(totalAmount)}đ
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary & submit */}
        <div className="space-y-2">
          {totalAmount > 0 && selectedMembers.size > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {formatVND(totalAmount)}đ ÷ {selectedMembers.size} người
              {splitType === "equal" &&
                ` = ${formatVND(Math.floor(totalAmount / selectedMembers.size))}đ/người`}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || totalAmount <= 0}
            className="w-full bg-[#3A5CCC] hover:bg-[#2d4aaa]"
            size="lg"
          >
            {submitting ? "Đang tạo..." : "Tạo hóa đơn"}
          </Button>
        </div>
      </main>
    </>
  );
}
