// Default node color — used when no color is assigned.
export const DEFAULT_NODE_COLOR = "#16a34a";

// Swamp depth color palette — shared between editor and create page.
// Shallow (light) to deep (dark).
export const NODE_COLORS = [
  "#bbf7d0", // 浅い (shallow)
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#16a34a", // 中間 (mid, default)
  "#15803d",
  "#166534",
  "#14532d", // 深い (deep)
] as const;

// Depth colors for the create page — fewer steps, earth-toned.
export const DEPTH_COLORS = [
  "#e8dfc8", // 0 — shallow
  "#c8dab8", // 1
  "#8aba82", // 2
  "#5a9a52", // 3
  "#2d5a32", // 4 — deep
] as const;

export function depthColor(index: number, total: number): string {
  if (total <= 1) return DEPTH_COLORS[0];
  const step = (DEPTH_COLORS.length - 1) / (total - 1);
  const ci = Math.round(index * step);
  return DEPTH_COLORS[ci];
}
