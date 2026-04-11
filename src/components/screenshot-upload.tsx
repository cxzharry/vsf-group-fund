"use client";

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseTransferScreenshot, matchesDebt } from "@/lib/ocr-parser";
import { formatVND } from "@/lib/format-vnd";
import type { OcrParseResult } from "@/lib/ocr-parser";

interface ScreenshotUploadProps {
  expectedAmount: number;
  onResult: (result: {
    imageFile: File;
    ocrResult: OcrParseResult;
    matches: boolean;
    reason: string;
  }) => void;
}

export function ScreenshotUpload({
  expectedAmount,
  onResult,
}: ScreenshotUploadProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ocrResult: OcrParseResult;
    matches: boolean;
    reason: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setProcessing(true);
    setProgress(0);

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    try {
      // Run OCR with Vietnamese language
      const worker = await createWorker("vie", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text, confidence },
      } = await worker.recognize(file);
      await worker.terminate();

      const ocrResult = parseTransferScreenshot(text, confidence);
      const { matches, reason } = matchesDebt(ocrResult, expectedAmount);

      setResult({ ocrResult, matches, reason });
      onResult({ imageFile: file, ocrResult, matches, reason });
    } catch {
      setResult({
        ocrResult: {
          amount: null,
          recipientName: null,
          date: null,
          content: null,
          rawText: "",
          confidence: 0,
        },
        matches: false,
        reason: "Lỗi xử lý ảnh. Thử lại hoặc xác nhận thủ công.",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!preview && (
        <Button
          variant="outline"
          className="w-full border-dashed py-8"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📸</span>
            <span className="text-sm">Chụp / upload ảnh xác nhận</span>
            <span className="text-xs text-muted-foreground">
              Cần chuyển: {formatVND(expectedAmount)}đ
            </span>
          </div>
        </Button>
      )}

      {preview && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Screenshot"
              className="mx-auto max-h-48 rounded-lg object-contain"
            />

            {processing && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-[#3A5CCC] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Đang đọc ảnh... {progress}%
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {result.matches ? (
                    <Badge className="bg-green-100 text-green-700">
                      Khớp
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Không khớp</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {result.reason}
                  </span>
                </div>

                {result.ocrResult.amount && (
                  <p className="text-center text-sm">
                    OCR đọc:{" "}
                    <span className="font-semibold">
                      {formatVND(result.ocrResult.amount)}đ
                    </span>
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setPreview(null);
                    setResult(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Chọn ảnh khác
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
