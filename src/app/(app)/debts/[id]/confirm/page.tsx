"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { formatVND } from "@/lib/format-vnd";
import { toast } from "sonner";
import type { Debt, Member } from "@/lib/types";
import type { OcrParseResult } from "@/lib/ocr-parser";

export default function ConfirmPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member } = useAuth();
  const supabase = createClient();

  const [debt, setDebt] = useState<Debt | null>(null);
  const [creditor, setCreditor] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ocrData, setOcrData] = useState<{
    imageFile: File;
    ocrResult: OcrParseResult;
    matches: boolean;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: debtData } = await supabase
        .from("debts")
        .select("*")
        .eq("id", id)
        .single();

      if (!debtData) {
        setLoading(false);
        return;
      }
      setDebt(debtData);

      const { data: creditorData } = await supabase
        .from("members")
        .select("*")
        .eq("id", debtData.creditor_id)
        .single();
      setCreditor(creditorData);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function submitWithScreenshot() {
    if (!debt || !ocrData || !member) return;
    setSubmitting(true);

    // Upload image to Supabase Storage
    const fileName = `${debt.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(fileName, ocrData.imageFile);

    if (uploadError) {
      toast.error("Lỗi upload ảnh");
      setSubmitting(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("payment-screenshots").getPublicUrl(fileName);

    // Create confirmation record
    const status = ocrData.matches ? "confirmed" : "pending";
    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id,
      confirmed_by: "debtor",
      method: "screenshot_ocr",
      image_url: publicUrl,
      ocr_result: ocrData.ocrResult,
      amount_detected: ocrData.ocrResult.amount,
      status,
    });

    // If OCR matches, auto-close debt
    if (ocrData.matches) {
      await supabase
        .from("debts")
        .update({ remaining: 0, status: "confirmed" })
        .eq("id", debt.id);
      toast.success("Xác nhận thành công! Khoản nợ đã được đóng.");
    } else {
      toast.info("Đã gửi ảnh. Chờ người nhận xác nhận.");
    }

    setSubmitting(false);
    router.push("/debts");
  }

  async function submitManual() {
    if (!debt || !member) return;
    setSubmitting(true);

    await supabase.from("payment_confirmations").insert({
      debt_id: debt.id,
      confirmed_by: "debtor",
      method: "manual_debtor",
      status: "pending",
    });

    toast.info("Đã gửi xác nhận. Chờ người nhận xác nhận.");
    setSubmitting(false);
    router.push("/debts");
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Xác nhận" backHref="/debts" />
        <div className="space-y-3 p-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 h-4 w-1/3 rounded-full bg-[#E5E5EA]" />
              <div className="h-3 w-full rounded-full bg-[#F2F2F7]" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!debt) {
    return (
      <>
        <PageHeader title="Xác nhận" backHref="/debts" />
        <p className="py-8 text-center text-muted-foreground">
          Không tìm thấy khoản nợ
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Xác nhận chuyển tiền" backHref="/debts" />
      <main className="space-y-4 p-4">
        {/* Debt info */}
        <Card>
          <CardContent className="space-y-1 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chuyển cho</span>
              <span className="font-medium">
                {creditor?.display_name ?? "?"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-bold text-lg">
                {formatVND(debt.remaining)}đ
              </span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Path 1: Screenshot + OCR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Cách 1: Upload ảnh xác nhận (Nhanh nhất)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chụp màn hình giao dịch thành công từ app ngân hàng
            </p>
          </CardHeader>
          <CardContent>
            <ScreenshotUpload
              expectedAmount={debt.remaining}
              onResult={(r) =>
                setOcrData({
                  imageFile: r.imageFile,
                  ocrResult: r.ocrResult,
                  matches: r.matches,
                })
              }
            />
            {ocrData && (
              <Button
                className="mt-3 w-full bg-[#3A5CCC] hover:bg-[#2d4aaa]"
                onClick={submitWithScreenshot}
                disabled={submitting}
              >
                {submitting
                  ? "Đang gửi..."
                  : ocrData.matches
                    ? "Xác nhận (khớp)"
                    : "Gửi ảnh (chờ duyệt)"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">hoặc</div>

        {/* Path 2: Manual confirm */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Cách 2: Xác nhận không gửi ảnh
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Người nhận sẽ cần xác nhận thủ công
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={submitManual}
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Đã chuyển tiền"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
