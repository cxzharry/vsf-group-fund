"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

type Step = 1 | 2;

// Generate a deterministic background color from a string
function getAvatarColor(str: string): string {
  const colors = [
    "#3A5CCC", "#5E5CE6", "#34C759", "#FF9500",
    "#FF2D55", "#AF52DE", "#00C7BE", "#FF6B35",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [emailInitial, setEmailInitial] = useState("?");
  const [avatarColor, setAvatarColor] = useState("#3A5CCC");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load current user email on mount
  if (!initialized) {
    setInitialized(true);
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const prefix = email.split("@")[0] || "User";
      setEmailPrefix(prefix);
      setDisplayName(prefix);
      setEmailInitial((prefix[0] ?? "U").toUpperCase());
      setAvatarColor(getAvatarColor(email));
    });
  }

  async function markSetupDone() {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      await supabase
        .from("members")
        .update({ setup_done: true })
        .eq("user_id", userId);
    }
  }

  // Step 1: save display name and advance
  async function handleStep1Continue() {
    setLoading(true);
    const name = displayName.trim() || emailPrefix;
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      await supabase
        .from("members")
        .update({ display_name: name })
        .eq("user_id", userId);
    }
    setLoading(false);
    setStep(2);
  }

  function handleStep1Skip() {
    setStep(2);
  }

  // Step 2: set password, mark setup done, redirect
  async function handleStep2Complete(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPasswordError(error.message);
      setLoading(false);
      return;
    }
    await markSetupDone();
    setLoading(false);
    router.push("/");
  }

  async function handleStep2Skip() {
    setLoading(true);
    await markSetupDone();
    setLoading(false);
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh items-end justify-center bg-white sm:items-center">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white px-6 pb-10 pt-8 sm:rounded-3xl sm:shadow-lg">

        {/* Step indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {([1, 2] as Step[]).map((s) => (
            <div
              key={s}
              className="h-2 w-2 rounded-full transition-colors"
              style={{ backgroundColor: s === step ? "#3A5CCC" : "#E5E5EA" }}
            />
          ))}
        </div>

        {/* Step 1: Avatar & Display Name */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <h1 className="mb-1 text-center text-[24px] font-bold text-[#1C1C1E]">
              Chào mừng!
            </h1>
            <p className="mb-8 text-center text-[15px] text-[#8E8E93]">
              Thiết lập hồ sơ của bạn
            </p>

            {/* Default avatar */}
            <div
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {emailInitial}
            </div>

            {/* Display name input */}
            <div className="mb-8 w-full border-b border-[#E5E5EA]">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên hiển thị"
                className="w-full bg-transparent py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
              />
            </div>

            {/* Buttons */}
            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={loading}
              className="flex h-[54px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#3A5CCC" }}
            >
              {loading ? "Đang lưu..." : "Tiếp tục"}
            </button>
            <button
              type="button"
              onClick={handleStep1Skip}
              className="mt-3 w-full text-center text-[15px] text-[#8E8E93]"
            >
              Bỏ qua
            </button>
          </div>
        )}

        {/* Step 2: Set Password */}
        {step === 2 && (
          <form onSubmit={handleStep2Complete} className="flex flex-col items-center">
            <h1 className="mb-1 text-center text-[24px] font-bold text-[#1C1C1E]">
              Đặt mật khẩu
            </h1>
            <p className="mb-8 text-center text-[15px] text-[#8E8E93]">
              Để đăng nhập nhanh hơn lần sau
            </p>

            {/* Lock icon */}
            <div
              className="mb-6 flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ backgroundColor: "#F2F2F7" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3A5CCC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            {/* Password fields */}
            <div className="mb-2 w-full overflow-hidden rounded-xl border border-[#E5E5EA]">
              <div className="border-b border-[#E5E5EA] px-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Mật khẩu mới"
                  autoComplete="new-password"
                  className="w-full bg-transparent py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                />
              </div>
              <div className="px-4">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  placeholder="Xác nhận mật khẩu"
                  autoComplete="new-password"
                  className="w-full bg-transparent py-3 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
                />
              </div>
            </div>

            <p className="mb-8 w-full text-[12px] text-[#8E8E93]">
              Tối thiểu 6 ký tự
            </p>

            {passwordError && (
              <p className="mb-4 w-full text-[13px] text-[#FF3B30]">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex h-[54px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#3A5CCC" }}
            >
              {loading ? "Đang lưu..." : "Hoàn tất"}
            </button>
            <button
              type="button"
              onClick={handleStep2Skip}
              disabled={loading}
              className="mt-3 w-full text-center text-[15px] text-[#8E8E93] disabled:opacity-50"
            >
              Bỏ qua
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
