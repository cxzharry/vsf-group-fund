"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "ACB", "BIDV",
  "VPBank", "TPBank", "Sacombank", "VietinBank", "HDBank",
];

export default function AccountPage() {
  const { member, signOut } = useAuth();
  const router = useRouter();
  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );

  const [displayName, setDisplayName] = useState(member?.display_name ?? "");
  const [bankName, setBankName] = useState(member?.bank_name ?? "");
  const [bankAccountNo, setBankAccountNo] = useState(member?.bank_account_no ?? "");
  const [bankAccountName, setBankAccountName] = useState(member?.bank_account_name ?? "");
  const [saving, setSaving] = useState(false);

  const initials = member?.display_name
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleSave() {
    if (!member) return;
    setSaving(true);

    const { error } = await supabase
      .from("members")
      .update({
        display_name: displayName.trim() || member.display_name,
        bank_name: bankName || null,
        bank_account_no: bankAccountNo || null,
        bank_account_name: bankAccountName || null,
      })
      .eq("id", member.id);

    setSaving(false);
    if (error) toast.error("Lỗi lưu thông tin");
    else toast.success("Đã lưu!");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <MobileHeader title="Tài khoản" />
      <main className="space-y-4 p-4">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={member?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{initials ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-semibold text-lg">{member?.display_name}</p>
            <p className="text-sm text-muted-foreground">{member?.email}</p>
          </div>
        </div>

        {/* Edit name */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tên hiển thị</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên của bạn"
            />
          </CardContent>
        </Card>

        {/* Bank info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thông tin ngân hàng</CardTitle>
            <p className="text-xs text-muted-foreground">
              Dùng để tạo QR khi người khác trả tiền cho bạn
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {BANKS.map((b) => (
                <button
                  key={b} type="button"
                  onClick={() => setBankName(b)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    bankName === b
                      ? "border-orange-600 bg-orange-50 text-orange-700"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ngân hàng" />
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="Số tài khoản" inputMode="numeric" />
            <Input
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
              placeholder="Tên chủ tài khoản" className="uppercase"
            />
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Thông báo Telegram</CardTitle>
          </CardHeader>
          <CardContent>
            {member?.telegram_chat_id ? (
              <p className="text-sm text-green-600">✅ Đã liên kết</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Gửi <code className="rounded bg-muted px-1">/start {member?.email}</code> cho bot Telegram để nhận thông báo
                </p>
                <a
                  href={`https://t.me/vsf_product_bot?start=${encodeURIComponent(member?.email ?? "")}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    📱 Liên kết Telegram
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>

        <Separator />

        {/* Sign out */}
        <Button variant="outline" className="w-full text-red-600" onClick={handleSignOut}>
          Đăng xuất
        </Button>
      </main>
    </>
  );
}
