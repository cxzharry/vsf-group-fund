import { parseVietnameseAmount, extractAllAmounts } from "../parse-vietnamese-amount";

describe("parseVietnameseAmount", () => {
  // "triệu" patterns
  test("1tr = 1,000,000", () => {
    expect(parseVietnameseAmount("1tr")).toBe(1_000_000);
  });
  test("1tr2 = 1,200,000", () => {
    expect(parseVietnameseAmount("1tr2")).toBe(1_200_000);
  });
  test("1tr5 = 1,500,000", () => {
    expect(parseVietnameseAmount("1tr5")).toBe(1_500_000);
  });
  test("2triệu = 2,000,000", () => {
    expect(parseVietnameseAmount("2triệu")).toBe(2_000_000);
  });
  test("1.5tr = 1,500,000", () => {
    expect(parseVietnameseAmount("1.5tr")).toBe(1_500_000);
  });
  test("10tr = 10,000,000", () => {
    expect(parseVietnameseAmount("10tr")).toBe(10_000_000);
  });

  // "k" patterns
  test("500k = 500,000", () => {
    expect(parseVietnameseAmount("500k")).toBe(500_000);
  });
  test("200K = 200,000", () => {
    expect(parseVietnameseAmount("200K")).toBe(200_000);
  });
  test("1.5k = 1,500", () => {
    expect(parseVietnameseAmount("1.5k")).toBe(1_500);
  });
  test("50k = 50,000", () => {
    expect(parseVietnameseAmount("50k")).toBe(50_000);
  });

  // Dot-separated VND
  test("1.200.000đ = 1,200,000", () => {
    expect(parseVietnameseAmount("1.200.000đ")).toBe(1_200_000);
  });
  test("500.000 = 500,000", () => {
    expect(parseVietnameseAmount("500.000")).toBe(500_000);
  });
  test("1.200.000 VND = 1,200,000", () => {
    expect(parseVietnameseAmount("1.200.000 VND")).toBe(1_200_000);
  });

  // Comma-separated
  test("1,200,000 = 1,200,000", () => {
    expect(parseVietnameseAmount("1,200,000")).toBe(1_200_000);
  });

  // Plain numbers
  test("500000 = 500,000", () => {
    expect(parseVietnameseAmount("500000")).toBe(500_000);
  });
  test("200000đ = 200,000", () => {
    expect(parseVietnameseAmount("200000đ")).toBe(200_000);
  });

  // In context
  test("parses from sentence: 'ăn trưa 1tr2 bún bò'", () => {
    expect(parseVietnameseAmount("ăn trưa 1tr2 bún bò")).toBe(1_200_000);
  });
  test("parses from sentence: 'chia 500k cho 6 người'", () => {
    expect(parseVietnameseAmount("chia 500k cho 6 người")).toBe(500_000);
  });
  test("parses from sentence: 'tổng 1.200.000đ'", () => {
    expect(parseVietnameseAmount("tổng 1.200.000đ")).toBe(1_200_000);
  });

  // No amount
  test("returns null for 'hello'", () => {
    expect(parseVietnameseAmount("hello")).toBeNull();
  });
  test("returns null for 'ok mai ăn nhé'", () => {
    expect(parseVietnameseAmount("ok mai ăn nhé")).toBeNull();
  });
  test("returns null for empty string", () => {
    expect(parseVietnameseAmount("")).toBeNull();
  });

  // Too small (< 1000)
  test("returns null for '50' (too small)", () => {
    expect(parseVietnameseAmount("50")).toBeNull();
  });
});

describe("extractAllAmounts", () => {
  test("extracts multiple amounts", () => {
    const amounts = extractAllAmounts("Mai 200k Linh 150k Huy 300k");
    expect(amounts).toContain(200_000);
    expect(amounts).toContain(150_000);
    expect(amounts).toContain(300_000);
  });

  test("returns empty for no amounts", () => {
    expect(extractAllAmounts("hello world")).toEqual([]);
  });

  test("deduplicates same amount", () => {
    const amounts = extractAllAmounts("500k rồi 500k nữa");
    expect(amounts).toEqual([500_000]);
  });
});
