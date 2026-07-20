import { isAxiosError } from 'axios';
import { apiClient } from './client';
import type { JobCommentDto, JobDto, JobHistoryEntryDto, JobPriority, JobStatus, PagedResult } from './types';

export interface GetJobsParams {
  status?: JobStatus;
  mechanicId?: string;
  page?: number;
  pageSize?: number;
}

export function getJobs(params: GetJobsParams = {}) {
  return apiClient.get<PagedResult<JobDto>>('/jobs', { params }).then((r) => r.data);
}

export function getJob(id: string) {
  return apiClient.get<JobDto>(`/jobs/${id}`).then((r) => r.data);
}

// A Bill outlives its ServiceJob — DeleteJob soft-deletes the job unconditionally, with no check
// for an existing bill (see ShiftLedger-API DeleteJob.cs), so any view that joins a bill back to
// its job's title/bikeModel (all-bills index, dashboard's top-unpaid panel) must tolerate that
// join 404ing instead of taking the whole list down over one orphaned reference.
export async function getJobSummary(id: string): Promise<Pick<JobDto, 'title' | 'bikeModel'> & { deleted: boolean }> {
  try {
    const job = await getJob(id);
    return { title: job.title, bikeModel: job.bikeModel, deleted: false };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return { title: '(deleted job)', bikeModel: '—', deleted: true };
    }
    throw error;
  }
}

export interface CreateJobRequest {
  title: string;
  description?: string | null;
  bikeModel: string;
  priority?: JobPriority | null;
  assignedMechanicId?: string | null;
  receivedDate?: string | null;
  dueDate?: string | null;
}

export function createJob(request: CreateJobRequest) {
  return apiClient.post<string>('/jobs', request).then((r) => r.data);
}

export interface UpdateJobRequest {
  id: string;
  title: string;
  description?: string | null;
  bikeModel: string;
  priority: JobPriority;
  dueDate?: string | null;
}

export function updateJob(id: string, request: UpdateJobRequest) {
  return apiClient.put(`/jobs/${id}`, request);
}

export function deleteJob(id: string) {
  return apiClient.delete(`/jobs/${id}`);
}

export function changeJobStatus(id: string, newStatus: JobStatus) {
  return apiClient.patch(`/jobs/${id}/status`, { newStatus });
}

export function assignMechanic(id: string, mechanicId: string) {
  return apiClient.patch(`/jobs/${id}/assign`, { mechanicId });
}

export function getJobComments(id: string) {
  return apiClient.get<JobCommentDto[]>(`/jobs/${id}/comments`).then((r) => r.data);
}

export function addJobComment(id: string, body: string) {
  return apiClient.post<string>(`/jobs/${id}/comments`, { body }).then((r) => r.data);
}

export function getJobHistory(id: string) {
  return apiClient.get<JobHistoryEntryDto[]>(`/jobs/${id}/history`).then((r) => r.data);
}
