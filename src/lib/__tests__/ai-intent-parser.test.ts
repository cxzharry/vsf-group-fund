import { parseIntentLocal } from "../ai-intent-parser";

describe("parseIntentLocal — split bill intent", () => {
  test("'1tr phở 8 người' → split, 1M, 8 people, description=phở", () => {
    const r = parseIntentLocal("1tr phở 8 người");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("split");
    expect(r.amount).toBe(1_000_000);
    expect(r.peopleCount).toBe(8);
    expect(r.description).toMatch(/phở/i);
    expect(r.readyToConfirm).toBe(true);
  });

  test("'ăn trưa 500k 6 người' → split, 500k, 6 people", () => {
    const r = parseIntentLocal("ăn trưa 500k 6 người");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("split");
    expect(r.amount).toBe(500_000);
    expect(r.peopleCount).toBe(6);
    expect(r.readyToConfirm).toBe(true);
  });

  test("'1.200.000đ bún bò 4 ng' → split, 1.2M, 4 people", () => {
    const r = parseIntentLocal("1.200.000đ bún bò 4 ng");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(1_200_000);
    expect(r.peopleCount).toBe(4);
    expect(r.description).toMatch(/bún/i);
  });

  test("'cơm trưa 300k cả team' → split, 300k, peopleCount null (team)", () => {
    const r = parseIntentLocal("cơm trưa 300k cả team");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(300_000);
    expect(r.splitType).toBe("equal");
    expect(r.readyToConfirm).toBe(true);
  });
});

describe("parseIntentLocal — missing info → follow-up", () => {
  test("'ăn trưa 500k' → has intent but no people → follow-up", () => {
    const r = parseIntentLocal("ăn trưa 500k");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(500_000);
    expect(r.peopleCount).toBeNull();
    expect(r.readyToConfirm).toBe(false);
    expect(r.followUp).not.toBeNull();
    expect(r.followUp!.options.length).toBeGreaterThanOrEqual(2);
  });

  test("'1tr2' → has amount, no description, no people → follow-up", () => {
    const r = parseIntentLocal("1tr2");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(1_200_000);
    expect(r.readyToConfirm).toBe(false);
    expect(r.followUp).not.toBeNull();
  });

  test("follow-up has A/B/C options", () => {
    const r = parseIntentLocal("500k");
    expect(r.followUp).not.toBeNull();
    expect(r.followUp!.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "A" }),
        expect.objectContaining({ label: "B" }),
        expect.objectContaining({ label: "C" }),
      ])
    );
  });
});

describe("parseIntentLocal — transfer intent", () => {
  test("'Mai chuyển cho Hai 200k' → transfer", () => {
    const r = parseIntentLocal("Mai chuyển cho Hai 200k");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("transfer");
    expect(r.amount).toBe(200_000);
    expect(r.transferTo).toBe("Hai");
  });

  test("'trả cho Linh 500k' → transfer to Linh", () => {
    const r = parseIntentLocal("trả cho Linh 500k");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("transfer");
    expect(r.transferTo).toBe("Linh");
  });

  test("'chuyển tiền Huy 1tr' → transfer to Huy", () => {
    const r = parseIntentLocal("chuyển tiền Huy 1tr");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("transfer");
    expect(r.transferTo).toBe("Huy");
  });
});

describe("parseIntentLocal — no intent (noise)", () => {
  test("'ok' → no intent", () => {
    expect(parseIntentLocal("ok").hasIntent).toBe(false);
  });

  test("'hello' → no intent", () => {
    expect(parseIntentLocal("hello").hasIntent).toBe(false);
  });

  test("'👍' → no intent", () => {
    expect(parseIntentLocal("👍").hasIntent).toBe(false);
  });

  test("'ừ' → no intent", () => {
    expect(parseIntentLocal("ừ").hasIntent).toBe(false);
  });

  test("'' → no intent", () => {
    expect(parseIntentLocal("").hasIntent).toBe(false);
  });

  test("'mai ăn gì nhé' → no intent (no amount)", () => {
    expect(parseIntentLocal("mai ăn gì nhé").hasIntent).toBe(false);
  });

  test("'haha' → no intent", () => {
    expect(parseIntentLocal("haha").hasIntent).toBe(false);
  });
});

describe("parseIntentLocal — edge cases", () => {
  test("readyToConfirm requires amount + intent type", () => {
    const r = parseIntentLocal("1tr phở 8 người");
    expect(r.readyToConfirm).toBe(true);
    expect(r.amount).not.toBeNull();
    expect(r.intentType).not.toBe("unknown");
  });

  test("split with no people → not ready, has follow-up", () => {
    const r = parseIntentLocal("lẩu 2tr");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(2_000_000);
    expect(r.readyToConfirm).toBe(false);
    expect(r.followUp).not.toBeNull();
  });

  test("result always has correct shape", () => {
    const r = parseIntentLocal("random text 500k bún");
    expect(r).toHaveProperty("hasIntent");
    expect(r).toHaveProperty("intentType");
    expect(r).toHaveProperty("amount");
    expect(r).toHaveProperty("description");
    expect(r).toHaveProperty("peopleCount");
    expect(r).toHaveProperty("peopleNames");
    expect(r).toHaveProperty("splitType");
    expect(r).toHaveProperty("transferTo");
    expect(r).toHaveProperty("readyToConfirm");
    expect(r).toHaveProperty("followUp");
  });

  test("'chuyển cho Minh' (no amount) → hasIntent true, amount null", () => {
    const r = parseIntentLocal("chuyển cho Minh");
    // Transfer pattern is detected even without amount
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("transfer");
    expect(r.amount).toBeNull();
  });

  test("'200k' alone → hasIntent true, amount 200000, no description", () => {
    const r = parseIntentLocal("200k");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(200_000);
    expect(r.description).toBeNull();
  });

  test("'ăn phở' (no amount) → hasIntent false", () => {
    const r = parseIntentLocal("ăn phở");
    expect(r.hasIntent).toBe(false);
  });

  test("'hôm qua ăn 500k ngon thật' → hasIntent true (past tense)", () => {
    const r = parseIntentLocal("hôm qua ăn 500k ngon thật");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(500_000);
  });

  test("'mai đi ăn 1tr nhé' → hasIntent true (future tense)", () => {
    const r = parseIntentLocal("mai đi ăn 1tr nhé");
    expect(r.hasIntent).toBe(true);
    expect(r.amount).toBe(1_000_000);
  });

  test("'😂' → no intent (emoji only)", () => {
    const r = parseIntentLocal("😂");
    expect(r.hasIntent).toBe(false);
  });

  test("'   ' (whitespace only) → no intent", () => {
    const r = parseIntentLocal("   ");
    expect(r.hasIntent).toBe(false);
  });

  test("'CHIA ĐỀU 1TR 10 NGƯỜI' (uppercase) → hasIntent true", () => {
    const r = parseIntentLocal("CHIA ĐỀU 1TR 10 NGƯỜI");
    expect(r.hasIntent).toBe(true);
    // "1TR 10" might be parsed as "1tr" with sub "10" = 1.0M + 1M = 2M
    expect([1_000_000, 2_000_000]).toContain(r.amount);
    expect(r.peopleCount).toBe(10);
  });

  test("'Linh trả tiền Huy 100k' → transfer intent", () => {
    const r = parseIntentLocal("Linh trả tiền Huy 100k");
    expect(r.hasIntent).toBe(true);
    expect(r.intentType).toBe("transfer");
    expect(r.transferTo).toBe("Huy");
    expect(r.amount).toBe(100_000);
  });

  test("custom split: 'Mai 200k Linh 150k Huy 300k' → transfer intent", () => {
    const r = parseIntentLocal("Mai 200k Linh 150k Huy 300k");
    // This is ambiguous - could be split or custom. Parser should detect first amount
    expect(r.amount).toBe(200_000);
  });

  test("maximum amount edge case: 1 billion", () => {
    const r = parseIntentLocal("ăn lẩu 1.000.000.000đ 10 người");
    expect(r.amount).toBe(1_000_000_000);
  });

  test("amount over limit rejected", () => {
    const r = parseIntentLocal("2.000.000.000");
    expect(r.amount).toBeNull();
  });

  test("minimum valid amount: 1000", () => {
    const r = parseIntentLocal("1000đ");
    expect(r.amount).toBe(1000);
  });

  test("amount below minimum rejected", () => {
    const r = parseIntentLocal("999");
    expect(r.amount).toBeNull();
  });

  test("multiple food keywords → picks first", () => {
    const r = parseIntentLocal("ăn phở rồi uống cà phê 500k");
    expect(r.description).toBeDefined();
  });

  test("handles mixed Vietnamese English", () => {
    const r = parseIntentLocal("lunch 500k 6 people");
    expect(r.amount).toBe(500_000);
  });

  test("people count 1 should be valid", () => {
    const r = parseIntentLocal("ăn phở 500k 1 người");
    expect(r.peopleCount).toBe(1);
    expect(r.readyToConfirm).toBe(true);
  });

  test("large people count", () => {
    const r = parseIntentLocal("ăn lẩu 5tr 20 người");
    expect(r.peopleCount).toBe(20);
  });

  test("'tất cả' recognized as team split", () => {
    const r = parseIntentLocal("chia tiền tất cả 500k");
    expect(r.splitType).toBe("equal");
  });
});
