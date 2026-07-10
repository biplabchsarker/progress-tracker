import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersService from '../services/usersService';
import type { Role } from '../types/auth';

const USERS_KEY = ['users'];

export function useUsers() {
  return useQuery({ queryKey: USERS_KEY, queryFn: usersService.listUsers });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ role: Role; isActive: boolean }> }) =>
      usersService.updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
