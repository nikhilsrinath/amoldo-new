/**
 * Justified bento packing.
 *
 * Splits an ordered list of aspect ratios (width / height) into rows so every
 * row spans the full width at one shared height, with no cropping. Each tile's
 * width is then `ratio / rowSum` of the row, so heights line up exactly.
 *
 * Rows are chosen by dynamic programming (order is preserved) to keep each
 * row's summed ratio close to `target` — a bigger target means more, shorter
 * tiles per row. Works for any count, including 0 and 1.
 */
export type RowSlot = { sum: number; n: number };

export function packRows(ratios: number[], target: number, maxPerRow = 4, minSum = target * 0.55): RowSlot[] {
  const n = ratios.length;
  const best = new Array<number>(n + 1).fill(Infinity);
  const cut = new Array<number>(n + 1).fill(0);
  best[0] = 0;

  for (let j = 1; j <= n; j++) {
    let sum = 0;
    for (let i = j - 1; i >= 0 && j - i <= maxPerRow; i--) {
      sum += ratios[i];
      // Squared distance from the ideal; rows that are far too tall cost extra.
      const cost = (sum - target) ** 2 + (sum < minSum ? (minSum - sum) * 2 : 0);
      if (best[i] + cost < best[j]) {
        best[j] = best[i] + cost;
        cut[j] = i;
      }
    }
  }

  // Walk back, then give every tile its row's info.
  const slots: RowSlot[] = new Array(n);
  for (let j = n; j > 0; j = cut[j]) {
    const i = cut[j];
    let sum = 0;
    for (let k = i; k < j; k++) sum += ratios[k];
    // A lone short row (e.g. one portrait) is narrowed instead of blown up.
    const s = Math.max(sum, minSum);
    for (let k = i; k < j; k++) slots[k] = { sum: s, n: j - i };
  }
  return slots;
}

/** Breakpoint targets — keep in sync with the `.bento` rules in globals.css. */
export const BENTO_TARGETS = {
  base: { target: 1, max: 1 }, // phones: one per row, full width
  sm: { target: 1.7, max: 3 }, // ≥640px
  lg: { target: 2.6, max: 4 }, // ≥1024px
} as const;
