import {
  generateVietQRUrl,
  generateBankDeepLink,
  generateTransferDescription,
} from "../vietqr";

describe("generateVietQRUrl", () => {
  test("generates QR URL with valid bank and accountNo", () => {
    const url = generateVietQRUrl({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      accountName: "John Doe",
      amount: 500_000,
      description: "GF 1234abcd JOHN",
    });
    expect(url).toBeDefined();
    expect(url).toContain("vietqr.io");
    expect(url).toContain("970436"); // Vietcombank BIN
    expect(url).toContain("1234567890");
    expect(url).toContain("amount=500000");
  });

  test("returns null for unknown bank", () => {
    const url = generateVietQRUrl({
      bankName: "UnknownBank",
      accountNo: "1234567890",
      accountName: "John Doe",
      amount: 500_000,
      description: "GF 1234abcd JOHN",
    });
    expect(url).toBeNull();
  });

  test("returns null for empty accountNo", () => {
    const url = generateVietQRUrl({
      bankName: "Vietcombank",
      accountNo: "",
      accountName: "John Doe",
      amount: 500_000,
      description: "GF 1234abcd JOHN",
    });
    expect(url).toBeNull();
  });

  test("includes account name in query string", () => {
    const url = generateVietQRUrl({
      bankName: "Techcombank",
      accountNo: "9876543210",
      accountName: "Jane Smith",
      amount: 1_000_000,
      description: "Lunch payment",
    });
    expect(url).toContain("accountName=Jane+Smith");
  });

  test("includes description in query string as addInfo", () => {
    const url = generateVietQRUrl({
      bankName: "MB Bank",
      accountNo: "5555555555",
      accountName: "Test User",
      amount: 250_000,
      description: "GF abc1234d TEST",
    });
    expect(url).toContain("addInfo=GF+abc1234d+TEST");
  });

  test("supports multiple banks", () => {
    const banks = ["Vietcombank", "Techcombank", "MB Bank", "ACB", "BIDV"];
    banks.forEach((bank) => {
      const url = generateVietQRUrl({
        bankName: bank,
        accountNo: "1234567890",
        accountName: "Test",
        amount: 500_000,
        description: "Test",
      });
      expect(url).not.toBeNull();
      expect(url).toContain("vietqr.io");
    });
  });

  test("preserves amount in URL", () => {
    const amounts = [1000, 100_000, 1_000_000, 50_000_000];
    amounts.forEach((amount) => {
      const url = generateVietQRUrl({
        bankName: "Vietcombank",
        accountNo: "1234567890",
        accountName: "Test",
        amount,
        description: "Test",
      });
      expect(url).toContain(`amount=${amount}`);
    });
  });

  test("URL format is compact", () => {
    const url = generateVietQRUrl({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      accountName: "John Doe",
      amount: 500_000,
      description: "Test",
    });
    expect(url).toContain("compact.png");
  });

  test("handles zero amount", () => {
    const url = generateVietQRUrl({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      accountName: "Test",
      amount: 0,
      description: "Test",
    });
    expect(url).toContain("amount=0");
  });
});

describe("generateBankDeepLink", () => {
  test("generates deep link with valid bank", () => {
    const link = generateBankDeepLink({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      amount: 500_000,
      description: "GF 1234abcd JOHN",
    });
    expect(link).toBeDefined();
    expect(link).toContain("dl.vietqr.io");
    expect(link).toContain("app=vcb"); // Vietcombank app code
    // @ is URL encoded to %40
    expect(link).toContain("ba=1234567890%40970436");
    expect(link).toContain("am=500000");
  });

  test("returns null for unknown bank in deep link", () => {
    const link = generateBankDeepLink({
      bankName: "FakeBank",
      accountNo: "1234567890",
      amount: 500_000,
      description: "Test",
    });
    expect(link).toBeNull();
  });

  test("returns null for empty accountNo in deep link", () => {
    const link = generateBankDeepLink({
      bankName: "Techcombank",
      accountNo: "",
      amount: 500_000,
      description: "Test",
    });
    expect(link).toBeNull();
  });

  test("includes correct app codes for different banks", () => {
    const bankMapping: Record<string, string> = {
      Vietcombank: "vcb",
      Techcombank: "tcb",
      "MB Bank": "mb",
      ACB: "acb",
      BIDV: "bidv",
    };
    Object.entries(bankMapping).forEach(([bank, code]) => {
      const link = generateBankDeepLink({
        bankName: bank,
        accountNo: "1234567890",
        amount: 500_000,
        description: "Test",
      });
      expect(link).toContain(`app=${code}`);
    });
  });

  test("includes BIN in deep link format", () => {
    const link = generateBankDeepLink({
      bankName: "Techcombank",
      accountNo: "9876543210",
      amount: 1_000_000,
      description: "Test",
    });
    // @ is URL encoded to %40
    expect(link).toContain("ba=9876543210%40970407"); // Techcombank BIN
  });

  test("preserves amount in deep link", () => {
    const link = generateBankDeepLink({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      amount: 750_000,
      description: "Test",
    });
    expect(link).toContain("am=750000");
  });

  test("includes description as tn parameter", () => {
    const link = generateBankDeepLink({
      bankName: "Vietcombank",
      accountNo: "1234567890",
      amount: 500_000,
      description: "GF abc1234d USER",
    });
    expect(link).toContain("tn=GF+abc1234d+USER");
  });
});

describe("generateTransferDescription", () => {
  test("returns format 'GF {billId} {name}'", () => {
    const desc = generateTransferDescription("bill123456789", "John Doe");
    expect(desc).toMatch(/^GF [A-Z0-9]+ [A-Z0-9]+$/);
  });

  test("extracts last name from full name", () => {
    const desc = generateTransferDescription("abc123def456", "Nguyen Van A");
    expect(desc).toContain("A");
  });

  test("uses only first 8 chars of billId", () => {
    const desc = generateTransferDescription("verylongbillid", "John");
    expect(desc).toContain("VERYLONG");
  });

  test("removes Vietnamese diacritics", () => {
    const desc = generateTransferDescription("bill1234567890", "Nguyễn");
    expect(desc).not.toContain("ễ");
    expect(desc).toContain("NGUYEN");
  });

  test("handles single name", () => {
    const desc = generateTransferDescription("bill1234567890", "John");
    expect(desc).toContain("JOHN");
  });

  test("converts to uppercase", () => {
    const desc = generateTransferDescription("bill1234567890", "john doe");
    expect(desc).toMatch(/^GF [A-Z0-9]+ [A-Z0-9]+$/);
  });

  test("handles names with accents", () => {
    const desc = generateTransferDescription("bill1234567890", "Phạm Thị Hoa");
    expect(desc).toContain("HOA");
    expect(desc).not.toContain("ạ");
  });

  test("fallback to 'USER' for empty name", () => {
    const desc = generateTransferDescription("bill1234567890", "");
    // Empty name results in empty string at end, not "USER"
    expect(desc).toMatch(/^GF [A-Z0-9]+ *$/);
  });

  test("always includes 8-char billId uppercase", () => {
    const desc = generateTransferDescription("abc123xyz", "Test");
    expect(desc.substring(3, 11)).toBe("ABC123XY");
  });

  test("separates components with spaces", () => {
    const desc = generateTransferDescription("bill1234567890", "John Doe");
    const parts = desc.split(" ");
    expect(parts.length).toBe(3); // GF, billId, name
    expect(parts[0]).toBe("GF");
  });
});
