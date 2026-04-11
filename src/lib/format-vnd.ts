/** Format integer VND amount with dot separator: 150000 → "150.000" */
export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN");
}

/** Parse VND string back to integer: "150.000" → 150000 */
export function parseVND(str: string): number {
  return parseInt(str.replace(/\./g, ""), 10) || 0;
}
