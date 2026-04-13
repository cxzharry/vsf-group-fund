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
 * Graph-based multi-hop simplification.
 * Computes net balance per person, then greedily matches creditors with debtors.
 * Result: minimal payment set (≤ N-1 for N non-zero-balance people).
 * Note: result does NOT preserve underlying_ids — payments are fully synthesized.
 */
export function simplifyDebtsGraph(debts: RawDebt[]): SimplifiedDebt[] {
  // 1. Compute net balance per person
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

  // 3. Greedy match: pair largest creditor with largest debtor
  const result: SimplifiedDebt[] = [];
  const allIds = debts.map(d => d.id);

  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.amount, d.amount);
    result.push({ debtor_id: d.id, creditor_id: c.id, amount, underlying_ids: allIds });
    c.amount -= amount;
    d.amount -= amount;
    if (c.amount === 0) ci++;
    if (d.amount === 0) di++;
  }

  return result;
}
