export function formatJobNumber(jobNumber: number): string {
  return `JOB-${jobNumber.toString().padStart(6, '0')}`;
}

export function formatBillNumber(billNumber: number): string {
  return `INV-${billNumber.toString().padStart(6, '0')}`;
}
