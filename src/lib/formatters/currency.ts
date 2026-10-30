/**
 * Formats a numeric amount to Pakistani Rupee string (e.g. ₨ 5,000)
 */
export function toPkrString(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₨ 0';
  }

  const num = Math.round(Number(amount));
  const formatted = num.toLocaleString('en-PK');
  return `₨ ${formatted}`;
}

export function parsePkrAmount(pkrStr: string): number {
  if (!pkrStr) return 0;
  const cleaned = pkrStr.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
