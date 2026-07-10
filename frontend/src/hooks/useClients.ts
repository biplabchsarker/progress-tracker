import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as clientsService from '../services/clientsService';

const CLIENTS_KEY = ['clients'];

export function useClients() {
  return useQuery({ queryKey: CLIENTS_KEY, queryFn: clientsService.listClients });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsService.createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<clientsService.ClientInput> }) =>
      clientsService.updateClient(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsService.deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}
