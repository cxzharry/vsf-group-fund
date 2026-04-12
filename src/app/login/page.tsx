"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

type Mode = "otp-send" | "otp-verify" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("otp-send");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMode("otp-verify");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Check if new user needs onboarding
    const userId = data.user?.id;
    if (userId) {
      const { data: member } = await supabase
        .from("members")
        .select("setup_done")
        .eq("user_id", userId)
        .single();

      setLoading(false);
      if (!member?.setup_done) {
        router.push("/setup");
      } else {
        router.push("/");
      }
    } else {
      setLoading(false);
      router.push("/");
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex min-h-dvh items-end justify-center bg-white sm:items-center">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white px-6 pb-10 pt-8 sm:rounded-3xl sm:shadow-lg">
        {/* App icon + branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] text-white"
            style={{ backgroundColor: "#3A5CCC" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-bold leading-tight text-[#1C1C1E]">
              NoPay<br />FreeLunch
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#8E8E93]">
              Nhập email để đăng nhập<br />hoặc tạo tài khoản mới.
            </p>
          </div>
        </div>

        {/* OTP send form */}
        {mode === "otp-send" && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="border-b border-[#E5E5EA]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                required
                className="w-full bg-transparent py-3 text-[#1C1C1E] placeholder-[#AEAEB2] outline-none text-[15px]"
              />
            </div>
            {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#3A5CCC" }}
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E5EA]" />
              <span className="text-xs text-[#8E8E93]">hoặc</span>
              <div className="h-px flex-1 bg-[#E5E5EA]" />
            </div>
            <button
              type="button"
              onClick={() => { setMode("password"); setError(""); }}
              className="w-full rounded-xl border border-[#E5E5EA] py-3.5 text-[15px] font-semibold text-[#1C1C1E] transition-colors hover:bg-[#F2F2F7]"
            >
              Nhập mật khẩu
            </button>
          </form>
        )}

        {/* OTP verify form */}
        {mode === "otp-verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-[#8E8E93]">
                Đã gửi mã xác nhận đến
              </p>
              <p className="mt-0.5 font-semibold text-[#1C1C1E]">{email}</p>
            </div>
            <div className="border-b border-[#E5E5EA]">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Mã 6 số"
                maxLength={6}
                autoFocus
                className="w-full bg-transparent py-3 text-center text-[22px] tracking-[0.3em] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none"
              />
            </div>
            {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#3A5CCC" }}
            >
              {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("otp-send"); setError(""); setOtp(""); }}
              className="w-full text-center text-sm text-[#8E8E93]"
            >
              Quay lại
            </button>
          </form>
        )}

        {/* Password login form */}
        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div className="space-y-0 rounded-xl border border-[#E5E5EA] overflow-hidden">
              <div className="border-b border-[#E5E5EA] px-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent py-3 text-[#1C1C1E] placeholder-[#AEAEB2] outline-none text-[15px]"
                />
              </div>
              <div className="px-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent py-3 text-[#1C1C1E] placeholder-[#AEAEB2] outline-none text-[15px]"
                />
              </div>
            </div>
            {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#3A5CCC" }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("otp-send"); setError(""); setPassword(""); }}
              className="w-full text-center text-sm text-[#8E8E93]"
            >
              Dùng OTP thay thế
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
