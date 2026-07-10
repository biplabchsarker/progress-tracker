import { api } from './api';
import type { Client } from '../types/entities';

export interface ClientInput {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export async function listClients(): Promise<Client[]> {
  const { data } = await api.get<{ clients: Client[] }>('/clients');
  return data.clients;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data } = await api.post<{ client: Client }>('/clients', input);
  return data.client;
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  const { data } = await api.patch<{ client: Client }>(`/clients/${id}`, input);
  return data.client;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
