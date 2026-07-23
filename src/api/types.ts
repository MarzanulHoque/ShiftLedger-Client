export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export type Role = 'SuperAdmin' | 'DepartmentAdmin' | 'Employee';

export type JobStatus = 'Received' | 'InProgress' | 'Completed' | 'Delivered';

export type JobPriority = 'Low' | 'Medium' | 'High';

export type LineItemType = 'Labor' | 'Part';

export type ReportType = 'Jobs' | 'Revenue' | 'UnpaidBills' | 'BillingHistory' | 'MechanicProductivity';

export type NotificationType =
  | 'JobAssigned'
  | 'JobStatusChanged'
  | 'BillPaid'
  | 'JobCreated'
  | 'JobOverdue'
  | 'BillUnpaid';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

export interface JobDto {
  id: string;
  jobNumber: number;
  departmentId: string;
  title: string;
  description: string | null;
  bikeModel: string;
  status: JobStatus;
  priority: JobPriority;
  assignedMechanicId: string | null;
  receivedDate: string;
  dueDate: string | null;
}

export interface JobCommentDto {
  id: string;
  authorId: string;
  body: string;
  createdAtUtc: string;
}

export interface JobHistoryEntryDto {
  action: string;
  changedById: string | null;
  changedAtUtc: string;
  oldValuesJson: string | null;
  newValuesJson: string | null;
}

export interface BillLineItemDto {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BillDto {
  id: string;
  billNumber: number;
  serviceJobId: string;
  isPaid: boolean;
  paidAtUtc: string | null;
  lines: BillLineItemDto[];
  total: number;
}

export interface BillSummaryDto {
  id: string;
  billNumber: number;
  serviceJobId: string;
  departmentId: string;
  isPaid: boolean;
  paidAtUtc: string | null;
  total: number;
}

export interface DepartmentBillingSummaryDto {
  departmentId: string;
  departmentName: string;
  totalCount: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
  grandTotal: number;
}

export interface StatusCountDto {
  status: JobStatus;
  count: number;
}

export interface MechanicWorkloadDto {
  mechanicId: string;
  mechanicName: string;
  openJobs: number;
}

export interface AdminDashboardDto {
  date: string;
  jobsReceivedToday: number;
  jobsByStatus: StatusCountDto[];
  mechanicWorkload: MechanicWorkloadDto[];
  unpaidBills: number;
  unpaidTotal: number;
  billsPaidToday: number;
  revenueToday: number;
}

export interface MyDashboardDto {
  myJobsByStatus: StatusCountDto[];
  myOpenJobs: JobDto[];
}

export interface DepartmentDashboardMetricsDto {
  departmentId: string;
  departmentName: string;
  jobsReceivedToday: number;
  openJobs: number;
  throughputLast7Days: number;
  unpaidBills: number;
  unpaidTotal: number;
  revenueToday: number;
}

export interface DepartmentDto {
  id: string;
  name: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
}

export interface NotificationDto {
  id: string;
  type: NotificationType | string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
}

export interface OrgSettingsDto {
  weekStartDay: string;
  currencyCode: string;
  overtimeMultiplier: number;
}

export interface ReportData {
  title: string;
  columns: string[];
  rows: Array<Array<string | number | boolean | null>>;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  mechanicId?: string;
  status?: JobStatus;
}
