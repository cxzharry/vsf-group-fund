import { simplifyDebts, simplifyDebtsGraph } from "../simplify-debts";

describe("simplifyDebts", () => {
  it("returns empty array for no debts", () => {
    expect(simplifyDebts([])).toEqual([]);
  });

  it("single debt A→B stays as-is", () => {
    const result = simplifyDebts([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ debtor_id: "A", creditor_id: "B", amount: 100 });
    expect(result[0].underlying_ids).toContain("d1");
  });

  it("A owes B 100, B owes A 30 → A owes B 70", () => {
    const result = simplifyDebts([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
      { id: "d2", debtor_id: "B", creditor_id: "A", remaining: 30 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ debtor_id: "A", creditor_id: "B", amount: 70 });
    expect(result[0].underlying_ids).toHaveLength(2);
  });

  it("A owes B 100, B owes A 100 → [] (fully netted)", () => {
    const result = simplifyDebts([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
      { id: "d2", debtor_id: "B", creditor_id: "A", remaining: 100 },
    ]);
    expect(result).toEqual([]);
  });

  it("multiple people, mixed pairs", () => {
    const result = simplifyDebts([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 50 },
      { id: "d2", debtor_id: "A", creditor_id: "C", remaining: 80 },
      { id: "d3", debtor_id: "C", creditor_id: "B", remaining: 20 },
      { id: "d4", debtor_id: "B", creditor_id: "A", remaining: 10 },
    ]);
    // A→B: 50, B→A: 10 → net A→B 40
    const ab = result.find((r) => r.debtor_id === "A" && r.creditor_id === "B");
    expect(ab).toBeDefined();
    expect(ab!.amount).toBe(40);

    // A→C: 80, no reverse → A→C 80
    const ac = result.find((r) => r.debtor_id === "A" && r.creditor_id === "C");
    expect(ac).toBeDefined();
    expect(ac!.amount).toBe(80);

    // C→B: 20, no reverse → C→B 20
    const cb = result.find((r) => r.debtor_id === "C" && r.creditor_id === "B");
    expect(cb).toBeDefined();
    expect(cb!.amount).toBe(20);

    expect(result).toHaveLength(3);
  });

  it("multiple debts same direction get summed", () => {
    const result = simplifyDebts([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 60 },
      { id: "d2", debtor_id: "A", creditor_id: "B", remaining: 40 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ debtor_id: "A", creditor_id: "B", amount: 100 });
    expect(result[0].underlying_ids).toHaveLength(2);
  });
});

describe("simplifyDebtsGraph", () => {
  it("returns empty array for no debts", () => {
    expect(simplifyDebtsGraph([])).toEqual([]);
  });

  it("single debt A→B stays as-is", () => {
    const result = simplifyDebtsGraph([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ debtor_id: "A", creditor_id: "B", amount: 100 });
  });

  it("A→B 100, B→A 100 → [] (fully netted)", () => {
    const result = simplifyDebtsGraph([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
      { id: "d2", debtor_id: "B", creditor_id: "A", remaining: 100 },
    ]);
    expect(result).toEqual([]);
  });

  it("classic cycle: A→B 50, B→C 50, C→A 50 → [] (all balances zero)", () => {
    const result = simplifyDebtsGraph([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 50 },
      { id: "d2", debtor_id: "B", creditor_id: "C", remaining: 50 },
      { id: "d3", debtor_id: "C", creditor_id: "A", remaining: 50 },
    ]);
    expect(result).toEqual([]);
  });

  it("multi-hop: A→B 100, B→C 100 → [A→C 100] (1 payment instead of 2)", () => {
    const result = simplifyDebtsGraph([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 100 },
      { id: "d2", debtor_id: "B", creditor_id: "C", remaining: 100 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ debtor_id: "A", creditor_id: "C", amount: 100 });
  });

  it("mixed: A→B 50, A→C 30, B→A 20 → minimal set", () => {
    // Net balances: A = -50-30+20 = -60, B = +50-20 = +30, C = +30
    // Creditors: B(30), C(30); Debtor: A(60)
    // Greedy: A→B 30 (B settled), A→C 30 (C settled) → 2 payments
    const result = simplifyDebtsGraph([
      { id: "d1", debtor_id: "A", creditor_id: "B", remaining: 50 },
      { id: "d2", debtor_id: "A", creditor_id: "C", remaining: 30 },
      { id: "d3", debtor_id: "B", creditor_id: "A", remaining: 20 },
    ]);
    expect(result).toHaveLength(2);
    const totalPaid = result.reduce((s, r) => s + r.amount, 0);
    expect(totalPaid).toBe(60); // total net debt of A = 60
    // All payments involve A as debtor
    for (const r of result) {
      expect(r.debtor_id).toBe("A");
    }
  });
});
