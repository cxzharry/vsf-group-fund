"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
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
  const [editing, setEditing] = useState<"profile" | "bank" | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const hasBankInfo = !!(member?.bank_name && member?.bank_account_no);

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

  const initials = member?.display_name
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

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
      setEditing(null);
      window.location.reload();
    }
  }

  function handleCancelEdit() {
    setDisplayName(member?.display_name ?? "");
    setBankName(member?.bank_name ?? "");
    setBankAccountNo(member?.bank_account_no ?? "");
    setBankAccountName(member?.bank_account_name ?? "");
    setEditing(null);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const maskedAccount = member?.bank_account_no
    ? `****${member.bank_account_no.slice(-4)}`
    : "";

  return (
    <>
      <PageHeader title="Tài khoản" showBack={false} />

      <main className="space-y-6 px-4 py-4">
        {/* Profile section */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: "#3A5CCC" }}
          >
            {initials}
          </div>
          <div className="flex items-center gap-2 text-center">
            <div>
              <p className="text-[17px] font-semibold text-[#1C1C1E]">
                {member?.display_name ?? "Chưa đặt tên"}
              </p>
              <p className="text-sm text-[#8E8E93]">{member?.email}</p>
            </div>
            <button
              onClick={() => setEditing("profile")}
              className="ml-1 flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-[#3A5CCC]"
            >
              Sửa
            </button>
          </div>
        </div>

        {/* Bank section */}
        <div>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
            Ngân hàng
          </p>
          <div className="overflow-hidden rounded-2xl bg-white">
            <button
              onClick={() => setEditing("bank")}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <span className="text-[15px] text-[#1C1C1E]">Tài khoản ngân hàng</span>
              <div className="flex items-center gap-2">
                {hasBankInfo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8E8E93]">
                      {member?.bank_name} {maskedAccount}
                    </span>
                    <span className="rounded-full bg-[#E8F9EF] px-2 py-0.5 text-xs font-medium text-[#34C759]">
                      Đã liên kết
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8E8E93]">Chưa liên kết</span>
                    <span className="text-sm font-medium text-[#3A5CCC]">Liên kết ngay</span>
                  </div>
                )}
                <ChevronRight />
              </div>
            </button>
          </div>
        </div>

        {/* Telegram section */}
        <div>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">
            Liên kết
          </p>
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <TelegramIcon />
                <span className="text-[15px] text-[#1C1C1E]">Telegram</span>
              </div>
              {member?.telegram_chat_id ? (
                <span className="rounded-full bg-[#E8F9EF] px-2 py-0.5 text-xs font-medium text-[#34C759]">
                  Đã liên kết
                </span>
              ) : (
                <a
                  href={`https://t.me/vsf_product_bot?start=${encodeURIComponent(member?.email ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-[#3A5CCC]"
                >
                  Liên kết
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="pt-2">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 py-3 text-sm font-medium text-[#FF3B30]"
          >
            <LogoutIcon />
            Đăng xuất
          </button>
        </div>
      </main>

      {/* Edit profile dialog */}
      <Dialog open={editing === "profile"} onOpenChange={(o) => !o && handleCancelEdit()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sửa tên hiển thị</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#E5E5EA]">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full px-4 py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 rounded-xl border border-[#E5E5EA] py-3 text-[15px] font-semibold text-[#1C1C1E]"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="flex-1 rounded-xl py-3 text-[15px] font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#3A5CCC" }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit bank dialog */}
      <Dialog open={editing === "bank"} onOpenChange={(o) => !o && handleCancelEdit()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thông tin ngân hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Bank quick-select chips */}
            <div className="flex flex-wrap gap-1.5">
              {BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBankName(b)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    bankName === b
                      ? "border-[#3A5CCC] bg-[#EEF2FF] text-[#3A5CCC]"
                      : "border-[#E5E5EA] text-[#1C1C1E] hover:border-[#3A5CCC]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-[#E5E5EA]">
              <div className="border-b border-[#E5E5EA] px-4">
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ngân hàng"
                  className="w-full bg-transparent py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                />
              </div>
              <div className="border-b border-[#E5E5EA] px-4">
                <input
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="Số tài khoản"
                  inputMode="numeric"
                  className="w-full bg-transparent py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                />
              </div>
              <div className="px-4">
                <input
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="Tên chủ tài khoản"
                  className="w-full bg-transparent py-3 text-[15px] uppercase text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 rounded-xl border border-[#E5E5EA] py-3 text-[15px] font-semibold text-[#1C1C1E]"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl py-3 text-[15px] font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#3A5CCC" }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign out confirm dialog */}
      <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đăng xuất?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#8E8E93]">
            Bạn sẽ cần đăng nhập lại để sử dụng app.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 rounded-xl border border-[#E5E5EA] py-3 text-[15px] font-semibold text-[#1C1C1E]"
            >
              Hủy
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 rounded-xl py-3 text-[15px] font-semibold text-white"
              style={{ backgroundColor: "#FF3B30" }}
            >
              Đăng xuất
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#29B6F6" />
      <path
        d="M17.607 6.24l-2.37 11.178c-.178.8-.643 1-.303 1-.337 0-.53-.213-.737-.417l-2.05-1.676-1.01.97c-.111.11-.205.203-.42.203l.15-2.133 3.863-3.49c.168-.15-.037-.233-.26-.083L6.33 14.967l-2.03-.634c-.44-.138-.45-.44.093-.65l11.117-4.28c.367-.133.687.09.567.65-.57 2.65-1.47-.643z"
        fill="white"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
