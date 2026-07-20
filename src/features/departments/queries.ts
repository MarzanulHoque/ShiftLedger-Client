import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../../api/departments';

const KEY = ['departments'];

export function useDepartments() {
  return useQuery({ queryKey: KEY, queryFn: getDepartments });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createDepartment(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateDepartment(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
