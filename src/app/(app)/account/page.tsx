"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const [displayName, setDisplayName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Track if user has saved bank info before
  const hasSavedBankInfo = !!(member?.bank_name && member?.bank_account_no);

  // Sync form state when member loads
  useEffect(() => {
    if (!member) return;
    const t = setTimeout(() => {
      setDisplayName(member.display_name ?? "");
      setBankName(member.bank_name ?? "");
      setBankAccountNo(member.bank_account_no ?? "");
      setBankAccountName(member.bank_account_name ?? "");
    }, 0);
    return () => clearTimeout(t);
  }, [member]);

  // Check if anything changed from saved values
  const hasChanges =
    displayName !== (member?.display_name ?? "") ||
    bankName !== (member?.bank_name ?? "") ||
    bankAccountNo !== (member?.bank_account_no ?? "") ||
    bankAccountName !== (member?.bank_account_name ?? "");

  const formDisabled = hasSavedBankInfo && !editing;

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
    if (error) {
      toast.error("Lỗi lưu thông tin");
    } else {
      toast.success("Đã lưu!");
      setEditing(false);
      // Force reload member data
      window.location.reload();
    }
  }

  function handleCancelEdit() {
    // Reset to saved values
    setDisplayName(member?.display_name ?? "");
    setBankName(member?.bank_name ?? "");
    setBankAccountNo(member?.bank_account_no ?? "");
    setBankAccountName(member?.bank_account_name ?? "");
    setEditing(false);
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
              disabled={formDisabled}
            />
          </CardContent>
        </Card>

        {/* Bank info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Thông tin ngân hàng</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Dùng để tạo QR khi người khác trả tiền cho bạn
                </p>
              </div>
              {hasSavedBankInfo && !editing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-orange-600"
                  onClick={() => setEditing(true)}
                >
                  Sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!formDisabled && (
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
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ngân hàng</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ngân hàng" disabled={formDisabled} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Số tài khoản</Label>
              <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="Số tài khoản" inputMode="numeric" disabled={formDisabled} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tên chủ tài khoản</Label>
              <Input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="Tên chủ tài khoản" className="uppercase" disabled={formDisabled}
              />
            </div>

            {/* Save / Cancel buttons — only show when editable and has changes */}
            {!formDisabled && (
              <div className="flex gap-2 pt-1">
                {editing && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
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
                  Gửi <code className="rounded bg-muted px-1">/start {member?.email}</code> cho bot Telegram
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

        {/* Sign out - subtle */}
        <div className="pt-4">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </main>

      {/* Sign out confirmation */}
      <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đăng xuất?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn sẽ cần đăng nhập lại để sử dụng app.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSignOutConfirm(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSignOut}
            >
              Đăng xuất
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
