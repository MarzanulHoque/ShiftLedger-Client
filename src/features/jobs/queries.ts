import { useQuery } from '@tanstack/react-query';
import { getJob, getJobComments, getJobHistory, getJobs, type GetJobsParams } from '../../api/jobs';

export function useJobBoard(mechanicId?: string, departmentId?: string) {
  return useQuery({
    queryKey: ['jobs', 'board', mechanicId, departmentId],
    queryFn: () => getJobs({ mechanicId, departmentId, pageSize: 100 }),
  });
}

export function useJobsList(params: GetJobsParams) {
  return useQuery({
    queryKey: ['jobs', 'list', params],
    queryFn: () => getJobs(params),
  });
}

export function useJob(id: string) {
  return useQuery({ queryKey: ['jobs', id], queryFn: () => getJob(id), enabled: Boolean(id) });
}

export function useJobComments(id: string) {
  return useQuery({ queryKey: ['jobs', id, 'comments'], queryFn: () => getJobComments(id), enabled: Boolean(id) });
}

export function useJobHistory(id: string) {
  return useQuery({ queryKey: ['jobs', id, 'history'], queryFn: () => getJobHistory(id), enabled: Boolean(id) });
}
