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
});
