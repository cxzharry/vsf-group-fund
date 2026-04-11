---
title: "Lunch Bill Splitter - Product Spec"
description: "Mobile web app chia tiền ăn trưa cho team ~20 người với VietQR + OCR xác nhận chuyển khoản"
status: pending
priority: P1
effort: 22h
branch: main
tags: [mobile-web, bill-split, vietqr, ocr, payments]
created: 2026-04-11
methodology: harness-engineering
---

# GoChi - Chia Tiền Ăn Trưa

## Problem
Team ~20 người ăn trưa cùng nhau hàng ngày. 1 người trả bill, còn lại chuyển khoản sau. Pain points:
- Không biết ai đã chuyển, ai chưa
- Người trả bill phải tự check banking app liên tục
- Số tiền lẻ, hay quên, hay thiếu
- Mỗi lần đổi người trả → lại phải chia lại từ đầu

## Product Vision
Mobile web app (PWA) mở nhanh trên điện thoại. Tạo bill → chọn ai ăn → auto chia tiền → tạo QR chuyển khoản → xác nhận thanh toán bằng 3 cách. Ai cũng có thể là người trả bill (xoay vòng).

## Target Users
- Team văn phòng ~20 người, ăn trưa nhóm hàng ngày
- Người dùng chính: trên điện thoại, lúc vừa ăn xong
- Tech-savvy vừa phải (biết scan QR, chụp màn hình)

## Core Features

### Sprint 1: Foundation
- **Đăng nhập** bằng Google (team dùng Google Workspace)
- **Quản lý thành viên**: danh sách team, mỗi người lưu thông tin ngân hàng (tên, STK, ngân hàng) để nhận tiền
- **Mobile-first UI**: bottom navigation, touch-friendly, PWA installable

### Sprint 2: Bill & Split
- **Tạo bill**: nhập tổng tiền, chọn người trả, chọn ai tham gia bữa ăn
- **Chia tiền**: chia đều (default) hoặc custom số tiền mỗi người
- **Lịch sử bill**: ai trả lần nào, bao nhiêu, khi nào
- **VND formatting**: hiển thị tiền VND đúng format (dấu chấm phân cách nghìn)

### Sprint 3: Debt & Payment
- **Dashboard nợ**: mỗi người thấy mình đang nợ ai bao nhiêu, ai đang nợ mình
- **Net balance**: tính bù trừ (A nợ B 50k, B nợ A 30k → A chỉ cần trả B 20k)
- **VietQR**: bấm "Trả tiền" → hiện QR code với đúng STK + số tiền + nội dung → scan là chuyển

### Sprint 4: Payment Confirmation (Core Feature)
3 cách xác nhận đã chuyển tiền:

**Cách 1 - Upload screenshot + OCR (preferred)**
- Người nợ chuyển tiền xong → chụp màn hình xác nhận từ banking app
- Upload lên app → OCR tự đọc số tiền, người nhận, ngày
- Nếu khớp với khoản nợ → auto xác nhận ✅
- Nếu không khớp → flag để người nhận review

**Cách 2 - Confirm không gửi ảnh**
- Người nợ bấm "Đã chuyển" (không upload ảnh)
- Người được trả tiền (creditor) nhận notification
- Creditor bấm "Đã nhận tiền" → close debt

**Cách 3 - Creditor tự mark (fallback)**
- Người được trả tiền luôn có option "Đã nhận tiền từ X"
- Dùng khi người nợ không dùng app hoặc quên confirm
- Ultimate fallback, không cần action từ debtor

### Sprint 5: Polish & Delight
- **Realtime updates**: khi ai đó pay → dashboard update ngay
- **Push notifications**: nhắc người chưa trả sau 1 ngày
- **Stats**: tháng này team ăn bao nhiêu, ai trả nhiều nhất, ai hay quên trả
- **Responsive animation**: smooth transitions, skeleton loading

## UX Principles
- **3 taps to pay**: Mở app → chọn khoản nợ → scan QR → done
- **Zero training**: UI đủ rõ ràng, không cần hướng dẫn
- **Trust but verify**: hệ thống tin người dùng (self-confirm) nhưng có audit trail
- **Mobile-first**: design for thumb-zone, large touch targets, bottom sheet modals

## Success Metrics
- Thời gian từ lúc ăn xong → tất cả đã chuyển tiền < 30 phút
- OCR accuracy > 80% trên các banking app phổ biến (Vietcombank, Techcombank, MB, ACB)
- 0 disputes về "tôi đã chuyển mà sao chưa ghi nhận"

## Tech Stack
- Next.js 15 + Supabase (new project) + Tailwind + shadcn/ui
- Client-side OCR (Tesseract.js)
- VietQR open standard (vietqr.io)
- Deploy: Vercel
- Mobile web app (PWA)

## Sprints → Generator Phases

| Sprint | Focus | Evaluator Criteria |
|--------|-------|--------------------|
| 1 | Auth + Members + Mobile shell | Can login, see member list, add bank info |
| 2 | Bill creation + split | Can create bill, see correct split amounts |
| 3 | Debt dashboard + VietQR | Can see debts, generate working QR code |
| 4 | Payment confirmation (OCR + manual) | Can upload screenshot, see OCR result, confirm payment |
| 5 | Polish + notifications + stats | Smooth UX, no janky transitions, push works |
