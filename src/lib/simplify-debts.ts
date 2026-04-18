export interface RawDebt {
  id: string;
  debtor_id: string;
  creditor_id: string;
  remaining: number;
}

export interface SimplifiedDebt {
  debtor_id: string;
  creditor_id: string;
  amount: number;
  underlying_ids: string[]; // original debt ids that were merged
}

/**
 * Pairwise netting: for each (debtor, creditor) pair, net out reverse debts.
 * Does NOT do multi-hop optimization (A owes B, B owes C → A owes C).
 * Returns only non-zero simplified debts.
 */
export function simplifyDebts(debts: RawDebt[]): SimplifiedDebt[] {
  // Group debts by unordered pair [smaller_id, larger_id]
  const pairMap = new Map<
    string,
    { aId: string; bId: string; aToB: number; bToA: number; ids: string[] }
  >();

  for (const d of debts) {
    const [aId, bId] = [d.debtor_id, d.creditor_id].sort();
    const key = `${aId}|${bId}`;
    const existing = pairMap.get(key) ?? { aId, bId, aToB: 0, bToA: 0, ids: [] };
    existing.ids.push(d.id);
    if (d.debtor_id === aId) existing.aToB += d.remaining;
    else existing.bToA += d.remaining;
    pairMap.set(key, existing);
  }

  const result: SimplifiedDebt[] = [];
  for (const pair of pairMap.values()) {
    const net = pair.aToB - pair.bToA;
    if (net === 0) continue;
    if (net > 0) {
      result.push({ debtor_id: pair.aId, creditor_id: pair.bId, amount: net, underlying_ids: pair.ids });
    } else {
      result.push({ debtor_id: pair.bId, creditor_id: pair.aId, amount: -net, underlying_ids: pair.ids });
    }
  }
  return result;
}

/**
 * Graph-based multi-hop simplification (Splitwise "minimum cash flow" algorithm).
 * Computes net balance per person, then greedily matches max creditor with max debtor.
 * Result: minimal payment set (≤ N-1 transactions for N people with non-zero balance).
 *
 * Edge cases handled:
 * - Circular debts (A→B→C→A equal amounts) → 0 transactions (net balances all zero)
 * - Self-loop prevention: debtors/creditors with bal=0 are excluded
 * - Integer VND amounts — no floating-point rounding issues
 *
 * Note: underlying_ids is empty [] because synthesized payments don't map 1:1 to raw debts.
 */
export function simplifyDebtsGraph(debts: RawDebt[]): SimplifiedDebt[] {
  if (debts.length === 0) return [];

  // 1. Compute net balance per person: positive = creditor, negative = debtor
  const balance = new Map<string, number>();
  for (const d of debts) {
    balance.set(d.debtor_id, (balance.get(d.debtor_id) ?? 0) - d.remaining);
    balance.set(d.creditor_id, (balance.get(d.creditor_id) ?? 0) + d.remaining);
  }

  // 2. Separate into creditors (positive) and debtors (negative), sorted by magnitude descending
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, bal] of balance.entries()) {
    if (bal > 0) creditors.push({ id, amount: bal });
    else if (bal < 0) debtors.push({ id, amount: -bal });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 3. Greedy match: pair largest creditor with largest debtor until all settled
  const result: SimplifiedDebt[] = [];

  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.amount, d.amount);
    // underlying_ids is [] — synthesized payments don't map 1:1 to raw debt rows
    result.push({ debtor_id: d.id, creditor_id: c.id, amount, underlying_ids: [] });
    c.amount -= amount;
    d.amount -= amount;
    if (c.amount === 0) ci++;
    if (d.amount === 0) di++;
  }

  return result;
}

/**
 * Compute net balance per member across all raw debts.
 * Returns map: member_id → net amount (positive = owed money, negative = owes money)
 */
export function computeNetBalances(debts: RawDebt[]): Map<string, number> {
  const balance = new Map<string, number>();
  for (const d of debts) {
    balance.set(d.debtor_id, (balance.get(d.debtor_id) ?? 0) - d.remaining);
    balance.set(d.creditor_id, (balance.get(d.creditor_id) ?? 0) + d.remaining);
  }
  return balance;
}
