import { formatVND, parseVND } from "../format-vnd";

describe("formatVND", () => {
  test("formatVND(0) → '0'", () => {
    expect(formatVND(0)).toBe("0");
  });

  test("formatVND(1000) → '1.000'", () => {
    expect(formatVND(1000)).toBe("1.000");
  });

  test("formatVND(1000000) → '1.000.000'", () => {
    expect(formatVND(1_000_000)).toBe("1.000.000");
  });

  test("formatVND(123456789) → '123.456.789'", () => {
    expect(formatVND(123_456_789)).toBe("123.456.789");
  });

  test("formatVND(500000) → '500.000'", () => {
    expect(formatVND(500_000)).toBe("500.000");
  });

  test("formatVND(100) → '100'", () => {
    expect(formatVND(100)).toBe("100");
  });

  test("formatVND(12345) → '12.345'", () => {
    expect(formatVND(12_345)).toBe("12.345");
  });

  test("formatVND handles billion amounts", () => {
    expect(formatVND(1_000_000_000)).toBe("1.000.000.000");
  });

  test("formatVND handles large amounts", () => {
    expect(formatVND(999_999_999)).toBe("999.999.999");
  });

  test("formatVND with small number", () => {
    expect(formatVND(99)).toBe("99");
  });
});

describe("parseVND", () => {
  test("parseVND('0') → 0", () => {
    expect(parseVND("0")).toBe(0);
  });

  test("parseVND('1.000') → 1000", () => {
    expect(parseVND("1.000")).toBe(1000);
  });

  test("parseVND('1.000.000') → 1000000", () => {
    expect(parseVND("1.000.000")).toBe(1_000_000);
  });

  test("parseVND('123.456.789') → 123456789", () => {
    expect(parseVND("123.456.789")).toBe(123_456_789);
  });

  test("parseVND('500.000') → 500000", () => {
    expect(parseVND("500.000")).toBe(500_000);
  });

  test("parseVND('abc') → 0", () => {
    expect(parseVND("abc")).toBe(0);
  });

  test("parseVND('') → 0", () => {
    expect(parseVND("")).toBe(0);
  });

  test("parseVND with mixed content → 0", () => {
    expect(parseVND("abc def")).toBe(0);
  });

  test("parseVND removes all dots", () => {
    expect(parseVND("1.000.000.000")).toBe(1_000_000_000);
  });

  test("parseVND handles number without dots", () => {
    expect(parseVND("500000")).toBe(500_000);
  });

  test("parseVND with null-like string", () => {
    expect(parseVND("null")).toBe(0);
  });

  test("parseVND with undefined-like string", () => {
    expect(parseVND("undefined")).toBe(0);
  });

  test("roundtrip: formatVND then parseVND", () => {
    const original = 1_234_567;
    const formatted = formatVND(original);
    const parsed = parseVND(formatted);
    expect(parsed).toBe(original);
  });

  test("roundtrip with zero", () => {
    const original = 0;
    const formatted = formatVND(original);
    const parsed = parseVND(formatted);
    expect(parsed).toBe(original);
  });

  test("roundtrip with billion", () => {
    const original = 1_000_000_000;
    const formatted = formatVND(original);
    const parsed = parseVND(formatted);
    expect(parsed).toBe(original);
  });
});
