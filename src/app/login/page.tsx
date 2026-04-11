"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Supabase sends OTP email, switch to verify mode
      setMode("verify");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "signup",
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setError("");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🍜</div>
          <CardTitle className="text-2xl font-bold">Group Fund</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chia tiền nhóm dễ dàng
          </p>
        </CardHeader>
        <CardContent>
          {mode === "verify" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="text-3xl">📧</div>
                <p className="mt-2 text-sm">
                  Đã gửi mã xác nhận đến <strong>{email}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Mã xác nhận (6 số)</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Đang xác nhận..." : "Xác nhận"}
              </Button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Gửi lại mã
              </button>
            </form>
          ) : (
            <form
              onSubmit={mode === "login" ? handleLogin : handleRegister}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Tối thiểu 6 ký tự" : ""}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                    ? "Đăng nhập"
                    : "Đăng ký"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                {mode === "login"
                  ? "Chưa có tài khoản? Đăng ký"
                  : "Đã có tài khoản? Đăng nhập"}
              </button>

            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
