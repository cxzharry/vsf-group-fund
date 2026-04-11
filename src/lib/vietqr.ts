// VietQR open standard - bank BIN codes for QR generation
const BANK_BINS: Record<string, string> = {
  "Vietcombank": "970436",
  "Techcombank": "970407",
  "MB Bank": "970422",
  "ACB": "970416",
  "BIDV": "970418",
  "VPBank": "970432",
  "TPBank": "970423",
  "Sacombank": "970403",
  "VietinBank": "970415",
  "HDBank": "970437",
  "OCB": "970448",
  "SHB": "970443",
  "MSB": "970426",
  "LienVietPostBank": "970449",
  "SeABank": "970440",
};

/** Generate VietQR image URL for a bank transfer */
export function generateVietQRUrl(params: {
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}): string | null {
  const bin = BANK_BINS[params.bankName];
  if (!bin || !params.accountNo) return null;

  const qs = new URLSearchParams({
    amount: params.amount.toString(),
    addInfo: params.description,
    accountName: params.accountName,
  });

  return `https://img.vietqr.io/image/${bin}-${params.accountNo}-compact.png?${qs}`;
}

// Bank app short codes for VietQR deep link
const BANK_APP_CODES: Record<string, string> = {
  "Vietcombank": "vcb",
  "Techcombank": "tcb",
  "MB Bank": "mb",
  "ACB": "acb",
  "BIDV": "bidv",
  "VPBank": "vpb",
  "TPBank": "tpb",
  "Sacombank": "stb",
  "VietinBank": "icb",
  "HDBank": "hdb",
  "OCB": "ocb",
  "SHB": "shb",
  "MSB": "msb",
};

/** Generate VietQR deep link to open banking app with pre-filled transfer */
export function generateBankDeepLink(params: {
  bankName: string;
  accountNo: string;
  amount: number;
  description: string;
}): string | null {
  const appCode = BANK_APP_CODES[params.bankName];
  const bin = BANK_BINS[params.bankName];
  if (!appCode || !bin || !params.accountNo) return null;

  const qs = new URLSearchParams({
    app: appCode,
    ba: `${params.accountNo}@${bin}`,
    am: params.amount.toString(),
    tn: params.description,
  });

  return `https://dl.vietqr.io/pay?${qs}`;
}

/** Generate a unique transfer description for matching */
export function generateTransferDescription(
  billId: string,
  debtorName: string
): string {
  // Short, readable, unique enough for matching
  const shortBill = billId.slice(0, 8).toUpperCase();
  const shortName = debtorName
    .split(" ")
    .pop()
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase() ?? "USER";
  return `GF ${shortBill} ${shortName}`;
}
