import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addJobComment,
  assignMechanic,
  changeJobStatus,
  createJob,
  deleteJob,
  updateJob,
  type CreateJobRequest,
  type UpdateJobRequest,
} from '../../api/jobs';
import type { JobStatus } from '../../api/types';

function invalidateJob(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  void queryClient.invalidateQueries({ queryKey: ['jobs'] });
  void queryClient.invalidateQueries({ queryKey: ['jobs', id] });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateJobRequest) => createJob(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateJobRequest) => updateJob(id, request),
    onSuccess: () => invalidateJob(queryClient, id),
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useChangeJobStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStatus: JobStatus) => changeJobStatus(id, newStatus),
    onSuccess: () => invalidateJob(queryClient, id),
  });
}

export function useAssignMechanic(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mechanicId: string) => assignMechanic(id, mechanicId),
    onSuccess: () => invalidateJob(queryClient, id),
  });
}

export function useAddJobComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => addJobComment(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', id, 'comments'] }),
  });
}
