"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

// Step 1: group creation form
// Step 2: invite members after successful creation

const EMOJI_OPTIONS = ["🍜", "🐱", "🏖️", "🎮", "🏠", "✈️", "🎁", "⋯"];

interface CreatedGroup {
  id: string;
  name: string;
  invite_code: string;
  emoji?: string;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const { member } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null);
  const [copied, setCopied] = useState(false);

  // --- Step 1: Create group ---

  async function handleCreate() {
    if (!name.trim() || !member) return;
    setSubmitting(true);

    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), memberId: member.id }),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error ?? "Lỗi tạo nhóm");
      setSubmitting(false);
      return;
    }

    setCreatedGroup({
      id: result.group.id,
      name: result.group.name,
      invite_code: result.group.invite_code,
      emoji: selectedEmoji ?? undefined,
    });
    setStep(2);
    setSubmitting(false);
  }

  // --- Step 2: Invite members ---

  const inviteLink = createdGroup
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${createdGroup.invite_code}`
    : "";

  async function handleCopyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Không thể sao chép");
    }
  }

  function handleShare(platform: "zalo" | "telegram" | "facebook" | "more") {
    const text = `Tham gia nhóm "${createdGroup?.name}" trên NoPay FreeLunch: ${inviteLink}`;
    if (platform === "more") {
      if (navigator.share) {
        navigator.share({ title: `Mời vào nhóm ${createdGroup?.name}`, url: inviteLink }).catch(() => {});
      } else {
        handleCopyLink();
      }
      return;
    }
    const urls: Record<string, string> = {
      zalo: `https://zalo.me/share?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(`Tham gia nhóm "${createdGroup?.name}" trên NoPay FreeLunch`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
    };
    window.open(urls[platform], "_blank", "noopener");
  }

  if (step === 1) {
    return (
      <div className="flex h-dvh flex-col bg-[#F2F2F7]">
        {/* Nav bar */}
        <header className="flex h-[52px] shrink-0 items-center bg-white px-4 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center text-[#3A5CCC]"
            aria-label="Quay lại"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          {/* Centered title */}
          <h1 className="flex-1 text-center text-[17px] font-bold text-[#1C1C1E]">Tạo nhóm</h1>
          {/* Spacer to balance back button */}
          <div className="h-8 w-8" />
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pt-10 pb-6 space-y-8">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2FF]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="#3A5CCC" className="h-9 w-9">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              {/* Camera overlay */}
              <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#3A5CCC] shadow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="white" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
            </div>
            <p className="text-[12px] text-[#8E8E93]">Ảnh nhóm (tuỳ chọn)</p>
          </div>

          {/* Name card */}
          <div className="rounded-xl bg-white px-4 pt-3 pb-4 shadow-sm space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]">Tên nhóm</p>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-transparent text-[15px] text-[#1C1C1E] outline-none placeholder:text-[#C7C7CC]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Team Product"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && !submitting && name.trim() && handleCreate()}
              />
              {name && (
                <button
                  type="button"
                  onClick={() => setName("")}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C7C7CC] text-white"
                  aria-label="Xóa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="h-px bg-[#E5E5EA]" />
            <p className="text-[12px] text-[#8E8E93]">Tên nhóm sẽ hiển thị với tất cả thành viên</p>
          </div>

          {/* Emoji card */}
          <div className="rounded-xl bg-white px-4 pt-3 pb-4 shadow-sm space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]">Emoji nhóm</p>
            <div className="flex gap-2.5 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji === selectedEmoji ? null : emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all"
                  style={
                    selectedEmoji === emoji
                      ? { border: "2px solid #3A5CCC", background: "#EEF2FF" }
                      : { border: "2px solid transparent", background: "#F2F2F7" }
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom button */}
        <div className="bg-white px-4 pt-3 pb-8 shadow-[0_-1px_0_#E5E5EA]">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            className="w-full h-[52px] rounded-[14px] bg-[#3A5CCC] text-[16px] font-bold text-white transition-opacity disabled:opacity-40"
          >
            {submitting ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Invite members
  if (!createdGroup) return null;

  const groupDisplayChar = createdGroup.emoji ?? createdGroup.name.charAt(0).toUpperCase();

  return (
    <div className="flex h-dvh flex-col bg-[#F2F2F7]">
      {/* Nav bar — no back button */}
      <header className="flex h-[52px] shrink-0 items-center justify-center bg-white shadow-sm">
        <h1 className="text-[17px] font-bold text-[#1C1C1E]">Mời thành viên</h1>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 space-y-6">
        {/* Group card */}
        <div className="flex flex-col items-center gap-3 rounded-[14px] bg-white px-4 py-5 shadow-sm">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3A5CCC] text-2xl font-bold text-white"
          >
            {groupDisplayChar}
          </div>
          <div className="text-center">
            <p className="text-[17px] font-bold text-[#1C1C1E]">{createdGroup.name}</p>
            <p className="text-[13px] text-[#8E8E93]">1 thành viên</p>
          </div>
        </div>

        {/* Link card */}
        <div className="rounded-[14px] bg-white px-4 pt-4 pb-5 shadow-sm space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]">Link mời nhóm</p>
          <div className="flex items-center gap-2 rounded-[10px] bg-[#F2F2F7] px-3 py-3">
            <p className="flex-1 truncate text-[13px] text-[#1C1C1E]">{inviteLink}</p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 text-[#3A5CCC]"
              aria-label="Sao chép link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
            </button>
          </div>
          {copied && (
            <p className="text-[13px] font-medium text-[#34C759]">✓ Đã sao chép link</p>
          )}
        </div>

        {/* QR card */}
        <div className="flex flex-col items-center gap-3 rounded-[14px] bg-white px-4 py-5 shadow-sm">
          {/* QR placeholder: shows invite code in a bordered box */}
          <div
            className="flex h-[140px] w-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E5EA] bg-[#F2F2F7]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="#C7C7CC" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75V16.5ZM16.5 6.75h.75v.75H16.5v-.75ZM13.5 13.5h.75v.75h-.75V13.5ZM13.5 19.5h.75v.75h-.75V19.5ZM19.5 13.5h.75v.75h-.75V13.5ZM19.5 19.5h.75v.75h-.75V19.5ZM16.5 16.5h.75v.75h-.75V16.5Z" />
            </svg>
            <p className="text-center text-[11px] font-mono font-semibold tracking-widest text-[#8E8E93]">
              {createdGroup.invite_code}
            </p>
          </div>
          <p className="text-[13px] text-[#8E8E93]">Quét mã QR để tham gia nhóm</p>
        </div>

        {/* Share section */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]">Chia sẻ qua</p>
          <div className="flex justify-center gap-4">
            {/* Zalo */}
            <button
              type="button"
              onClick={() => handleShare("zalo")}
              className="flex flex-col items-center gap-1.5"
              aria-label="Chia sẻ qua Zalo"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0068FF] text-white text-lg font-bold shadow-sm">
                Z
              </div>
              <span className="text-[11px] text-[#8E8E93]">Zalo</span>
            </button>
            {/* Telegram */}
            <button
              type="button"
              onClick={() => handleShare("telegram")}
              className="flex flex-col items-center gap-1.5"
              aria-label="Chia sẻ qua Telegram"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2AABEE] text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 13.617l-2.94-.917c-.64-.203-.652-.64.135-.954l11.498-4.43c.534-.194 1.002.13.72.905z"/>
                </svg>
              </div>
              <span className="text-[11px] text-[#8E8E93]">Telegram</span>
            </button>
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleShare("facebook")}
              className="flex flex-col items-center gap-1.5"
              aria-label="Chia sẻ qua Facebook"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-[11px] text-[#8E8E93]">Facebook</span>
            </button>
            {/* More */}
            <button
              type="button"
              onClick={() => handleShare("more")}
              className="flex flex-col items-center gap-1.5"
              aria-label="Chia sẻ thêm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5E5EA] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="#1C1C1E" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <span className="text-[11px] text-[#8E8E93]">Khác</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="bg-white px-4 pt-3 pb-8 shadow-[0_-1px_0_#E5E5EA]">
        <button
          type="button"
          onClick={() => {
            try { sessionStorage.removeItem("home_groups"); } catch {}
            router.push(`/groups/${createdGroup.id}`);
          }}
          className="w-full h-[52px] rounded-[14px] bg-[#3A5CCC] text-[16px] font-bold text-white"
        >
          Vào nhóm ngay
        </button>
      </div>
    </div>
  );
}
