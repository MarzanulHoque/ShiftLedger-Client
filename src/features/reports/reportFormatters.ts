import { formatDate, formatDateTime } from '../../lib/date';
import { formatMoney } from '../../lib/money';
import type { ReportType } from '../../api/types';

type CellValue = string | number | boolean | null;
type CellFormatter = (value: CellValue, currencyCode?: string) => string;

const text: CellFormatter = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
const dateOnly: CellFormatter = (v) => formatDate(v as string | null);
const dateTime: CellFormatter = (v) => formatDateTime(v as string | null);
const money: CellFormatter = (v, currency) => formatMoney(Number(v) || 0, currency);

// Column order/semantics per report type — see docs/04_API_Specification.md; the API returns a
// generic {title, columns, rows} envelope with no per-column type tag, so the exact shape has
// to be known here rather than inferred at render time.
export const REPORT_FORMATTERS: Record<ReportType, CellFormatter[]> = {
  Jobs: [text, text, text, text, dateOnly, dateOnly],
  Revenue: [dateOnly, text, money],
  UnpaidBills: [text, text, dateOnly, money],
  BillingHistory: [text, text, dateOnly, money, text, dateTime],
  MechanicProductivity: [text, text, text, text, text],
};

export const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'Jobs', label: 'Jobs' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'UnpaidBills', label: 'Unpaid bills' },
  { value: 'BillingHistory', label: 'Billing history' },
  { value: 'MechanicProductivity', label: 'Mechanic productivity' },
];
