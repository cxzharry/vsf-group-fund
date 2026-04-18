// Greedy multi-hop debt simplification (Splitwise "Settle up" style).
// Compresses an N-party debt graph into the minimum number of pair transfers
// while preserving each member's net balance. Does NOT modify debts in DB —
// this is a derived view. Underlying bill↔debt links stay intact for audit.

export interface DebtRow {
  debtor_id: string;
  creditor_id: string;
  /** Remaining amount (VND integer) — typically from `debts.remaining` */
  remaining: number;
}

export interface SimplifiedTransfer {
  from: string; // debtor member id
  to: string;   // creditor member id
  amount: number;
}

/**
 * Greedy settle-up: pair the largest debtor with the largest creditor
 * repeatedly. O(n log n) per iteration × ≤ n iterations.
 *
 * Property: for n members the output has at most n-1 transfers
 * (minimum bound for any connected settlement graph).
 */
export function simplifyDebts(debts: DebtRow[]): SimplifiedTransfer[] {
  // 1. Compute net balance per member
  const balance: Record<string, number> = {};
  for (const d of debts) {
    if (d.remaining <= 0) continue;
    balance[d.debtor_id] = (balance[d.debtor_id] ?? 0) - d.remaining;
    balance[d.creditor_id] = (balance[d.creditor_id] ?? 0) + d.remaining;
  }

  // 2. Split into debtors (negative) and creditors (positive)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];
  for (const [id, bal] of Object.entries(balance)) {
    if (bal > 0) creditors.push({ id, amount: bal });
    else if (bal < 0) debtors.push({ id, amount: -bal });
  }

  // 3. Greedy match — sort descending, pop largest on each side
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SimplifiedTransfer[] = [];
  const EPSILON = 1; // VND rounding tolerance
  while (creditors.length > 0 && debtors.length > 0) {
    const cr = creditors[0];
    const db = debtors[0];
    const amount = Math.min(cr.amount, db.amount);
    transfers.push({ from: db.id, to: cr.id, amount: Math.round(amount) });
    cr.amount -= amount;
    db.amount -= amount;
    if (cr.amount < EPSILON) creditors.shift();
    if (db.amount < EPSILON) debtors.shift();
  }
  return transfers;
}

/** Extract transfers involving a specific member (either side). */
export function transfersForMember(
  transfers: SimplifiedTransfer[],
  memberId: string
): { outgoing: SimplifiedTransfer[]; incoming: SimplifiedTransfer[] } {
  return {
    outgoing: transfers.filter((t) => t.from === memberId),
    incoming: transfers.filter((t) => t.to === memberId),
  };
}
