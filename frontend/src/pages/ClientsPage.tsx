import { useState, FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DataTable from '../components/DataTable';
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients';
import type { Client } from '../types/entities';

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createClient.mutateAsync({
        name,
        contactPerson: contactPerson || undefined,
        email: email || undefined,
      });
      setName('');
      setContactPerson('');
      setEmail('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to create client' : 'Failed to create client');
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Archive client "${client.name}"?`)) return;
    try {
      await deleteClient.mutateAsync(client.id);
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to archive client' : 'Failed to archive client');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>

      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Contact person</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <button type="submit" disabled={createClient.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
          Add client
        </button>
        {error && <p className="text-red-400 text-xs w-full">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <DataTable
          rows={clients ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No clients yet."
          columns={[
            { key: 'name', header: 'Name', render: (c) => c.name },
            { key: 'contact', header: 'Contact', render: (c) => c.contactPerson ?? '—' },
            { key: 'email', header: 'Email', render: (c) => c.email ?? '—' },
            {
              key: 'actions',
              header: '',
              render: (c) => (
                <button onClick={() => handleDelete(c)} className="text-red-400 hover:text-red-300 text-xs">
                  Archive
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
