"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Common Vietnamese banks for quick selection
const BANKS = [
  "Vietcombank", "Techcombank", "MB Bank", "ACB", "BIDV",
  "VPBank", "TPBank", "Sacombank", "VietinBank", "HDBank",
  "OCB", "SHB", "MSB", "LienVietPostBank", "SeABank",
];

export default function ProfilePage() {
  const { member } = useAuth();
  const [bankName, setBankName] = useState(member?.bank_name ?? "");
  const [bankAccountNo, setBankAccountNo] = useState(member?.bank_account_no ?? "");
  const [bankAccountName, setBankAccountName] = useState(member?.bank_account_name ?? "");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    if (!member) return;
    setSaving(true);

    const { error } = await supabase
      .from("members")
      .update({
        bank_name: bankName || null,
        bank_account_no: bankAccountNo || null,
        bank_account_name: bankAccountName || null,
      })
      .eq("id", member.id);

    setSaving(false);

    if (error) {
      toast.error("Lỗi khi lưu thông tin ngân hàng");
    } else {
      toast.success("Đã lưu thông tin ngân hàng");
    }
  }

  return (
    <>
      <MobileHeader title="Tài khoản" />
      <main className="space-y-4 p-4">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tên:</span>{" "}
              {member?.display_name}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {member?.email}
            </p>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông báo Telegram</CardTitle>
            <p className="text-xs text-muted-foreground">
              Nhận thông báo chia tiền qua Telegram
            </p>
          </CardHeader>
          <CardContent>
            {member?.telegram_chat_id ? (
              <p className="text-sm text-green-600">
                ✅ Đã liên kết Telegram
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Chưa liên kết. Bấm link bên dưới → gửi{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    /start {member?.email}
                  </code>{" "}
                  cho bot.
                </p>
                <a
                  href={`https://t.me/group_bill_bot?start=${encodeURIComponent(member?.email ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <span>📱</span> Liên kết Telegram
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin ngân hàng</CardTitle>
            <p className="text-xs text-muted-foreground">
              Dùng để tạo QR chuyển khoản khi người khác trả tiền cho bạn
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Ngân hàng</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {BANKS.slice(0, 6).map((b) => (
                  <button
                    key={b}
                    type="button"
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
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Tên ngân hàng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-account-no">Số tài khoản</Label>
              <Input
                id="bank-account-no"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="VD: 0123456789"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-account-name">Tên chủ tài khoản</Label>
              <Input
                id="bank-account-name"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="VD: NGUYEN VAN A"
                className="uppercase"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
