import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/users';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers });
}

export function useMechanics() {
  const query = useUsers();
  return { ...query, data: query.data?.filter((u) => u.role === 'Employee' && u.isActive) };
}
