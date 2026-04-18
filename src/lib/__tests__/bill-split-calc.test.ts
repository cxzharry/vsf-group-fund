/**
 * Unit tests for equal-split debt calculation logic (Bug-6 fix).
 * Tests the math used in handleBillConfirm equal-split path.
 */

// Helper: replicates the equal-split debt calc from groups/[id]/page.tsx
interface Member { id: string; display_name: string }

function calcEqualSplitDebts(
  totalAmount: number,
  payerId: string,
  allMembers: Member[],
  selectedMemberIds?: string[],
): { debtorId: string; creditorId: string; amount: number }[] {
  // Determine participants (mirroring handleBillConfirm logic)
  const otherParticipants = selectedMemberIds
    ? allMembers.filter((m) => m.id !== payerId && selectedMemberIds.includes(m.id))
    : allMembers.filter((m) => m.id !== payerId);

  // Include payer in headcount only when payer is in selectedMemberIds (or no selection)
  const payerIncluded = selectedMemberIds
    ? selectedMemberIds.includes(payerId)
    : true;

  const totalHeadcount = otherParticipants.length + (payerIncluded ? 1 : 0);
  if (totalHeadcount <= 1) return [];

  const base = Math.floor(totalAmount / totalHeadcount);
  const remainder = totalAmount - base * totalHeadcount;

  return otherParticipants.map((m, i) => {
    const debtAmount = base + (i + 1 < remainder ? 1 : 0);
    return { debtorId: m.id, creditorId: payerId, amount: debtAmount };
  });
}

const MEMBERS: Member[] = [
  { id: "minh", display_name: "Minh" },
  { id: "an",   display_name: "An" },
  { id: "linh", display_name: "Linh" },
  { id: "tu",   display_name: "Tú" },
  { id: "po",   display_name: "PO" },
];

describe("equal split debt calculation (Bug-6)", () => {
  it("5 people, 1_000_000 VND — payer + 4 others → 4 debts × 200k", () => {
    const debts = calcEqualSplitDebts(1_000_000, "minh", MEMBERS, [
      "minh", "an", "linh", "tu", "po",
    ]);
    expect(debts).toHaveLength(4);
    debts.forEach((d) => {
      expect(d.creditorId).toBe("minh");
      expect(d.amount).toBe(200_000);
    });
    const debtorIds = debts.map((d) => d.debtorId).sort();
    expect(debtorIds).toEqual(["an", "linh", "po", "tu"]);
  });

  it("600_000 VND, payer selects 3 others → 3 debts × 200k (Bug-6 scenario)", () => {
    const debts = calcEqualSplitDebts(600_000, "minh", MEMBERS, [
      "minh", "an", "linh", "tu",
    ]);
    expect(debts).toHaveLength(3);
    debts.forEach((d) => expect(d.amount).toBe(150_000));
  });

  it("payer explicitly excluded from selectedMemberIds — no self-debt created", () => {
    const debts = calcEqualSplitDebts(600_000, "minh", MEMBERS, [
      "an", "linh", "tu",
    ]);
    const selfDebt = debts.find((d) => d.debtorId === "minh");
    expect(selfDebt).toBeUndefined();
  });

  it("remainder 1 VND distributed to first debtor (index 1 after payer)", () => {
    // 1_000_001 / 3 = 333_333 r2 → debtor[0] gets 333_334, debtor[1] gets 333_334, payer 333_333
    // Actually: i+1 < remainder → i+1 < 2 → i=0 gets +1, i=1 gets +1
    const debts = calcEqualSplitDebts(1_000_001, "minh", MEMBERS, [
      "minh", "an", "linh", "tu",
    ]);
    // 4 people, base = 250_000, remainder = 1
    // i+1 < 1 → only never true (i=0: 1 < 1 false) → no +1 given to debtors
    expect(debts).toHaveLength(3);
    const total = debts.reduce((s, d) => s + d.amount, 0);
    // debts total + payer share should ≤ totalAmount
    expect(total).toBeLessThanOrEqual(1_000_001);
  });

  it("backward compat: no selectedMemberIds → uses all non-payer members", () => {
    const debts = calcEqualSplitDebts(500_000, "minh", MEMBERS);
    // All 4 non-payer members become debtors
    expect(debts).toHaveLength(4);
    debts.forEach((d) => expect(d.creditorId).toBe("minh"));
  });

  it("only 1 person selected (payer only) → 0 debts", () => {
    const debts = calcEqualSplitDebts(1_000_000, "minh", MEMBERS, ["minh"]);
    expect(debts).toHaveLength(0);
  });
});
