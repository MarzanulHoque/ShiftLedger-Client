import type { JobStatus } from '../api/types';

// Resolved hex values for theme.ts's brand/steel/success/danger/slate shade-6 (slate shade-8 for
// a "closed out" darker neutral) — Recharts' fill/stroke props are plain SVG attributes, not CSS,
// so a `var(--mantine-color-*)` string can't be relied on to resolve there. Keep in sync with
// theme.ts if that palette ever changes.
export const CHART_COLORS = {
  brand: '#BF5A2C',
  success: '#4E9D5F',
  danger: '#B03A3A',
  steel: '#3B7CAF',
  slate: '#667884',
  slateDark: '#444E55',
};

// Same status color language as lib/statusColors.ts (STATUS_META), just as SVG-safe hex — reused
// across every status-colored chart so "Completed" is always the same green wherever it appears.
// Received/Delivered are intentionally desaturated (queued/closed-out, neutral by design) — every
// chart using this map also carries a visible axis tick or legend label, so identity never rests
// on telling those two neutrals apart by hue alone.
export const STATUS_CHART_COLOR: Record<JobStatus, string> = {
  Received: CHART_COLORS.slate,
  InProgress: CHART_COLORS.steel,
  Completed: CHART_COLORS.success,
  Delivered: CHART_COLORS.slateDark,
};
