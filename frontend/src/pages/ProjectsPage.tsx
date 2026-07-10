import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import DataTable from '../components/DataTable';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useAuthStore } from '../store/authStore';
import type { Project, ProjectCategory } from '../types/entities';

const CATEGORY_BADGE: Record<ProjectCategory, string> = {
  CLIENT: 'bg-teal-950 text-teal-400 border-teal-800',
  INTERNAL: 'bg-purple-950 text-purple-400 border-purple-800',
};

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === 'ADMIN' || user?.role === 'PM';

  const { data: projects, isLoading } = useProjects();
  const { data: clients } = useClients();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('INTERNAL');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createProject.mutateAsync({
        name,
        category,
        clientId: category === 'CLIENT' ? clientId : undefined,
      });
      setName('');
      setClientId('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to create project' : 'Failed to create project');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      {canCreate && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
              <option value="INTERNAL">INTERNAL</option>
              <option value="CLIENT">CLIENT</option>
            </select>
          </div>
          {category === 'CLIENT' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[160px]">
                <option value="">Select a client…</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={createProject.isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
            Add project
          </button>
          {error && <p className="text-red-400 text-xs w-full">{error}</p>}
        </form>
      )}

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <DataTable
          rows={projects ?? []}
          rowKey={(p) => p.id}
          emptyMessage="No projects yet."
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (p: Project) => <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">{p.name}</Link>,
            },
            {
              key: 'category',
              header: 'Category',
              render: (p) => (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[p.category]}`}>{p.category}</span>
              ),
            },
            { key: 'client', header: 'Client', render: (p) => p.client?.name ?? '—' },
            { key: 'status', header: 'Status', render: (p) => p.status },
            { key: 'tasks', header: 'Tasks', render: (p) => (p.category === 'INTERNAL' || p.tasksEnabled ? p._count?.tasks ?? 0 : '—') },
          ]}
        />
      )}
    </div>
  );
}
