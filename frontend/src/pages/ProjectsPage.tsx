import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import DataTable from '../components/DataTable';
import CategoryBadge from '../components/CategoryBadge';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useAuthStore } from '../store/authStore';
import type { Project, ProjectCategory } from '../types/entities';

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
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-end dark:bg-slate-900 dark:border-slate-800">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="INTERNAL">INTERNAL</option>
              <option value="CLIENT">CLIENT</option>
            </select>
          </div>
          {category === 'CLIENT' && (
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 min-w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-white">
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
          {error && <p className="text-red-600 dark:text-red-400 text-xs w-full">{error}</p>}
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
              render: (p: Project) => <Link to={`/projects/${p.id}`} className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">{p.name}</Link>,
            },
            {
              key: 'category',
              header: 'Category',
              render: (p) => <CategoryBadge category={p.category} />,
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
