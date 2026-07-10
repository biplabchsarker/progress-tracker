import { isAxiosError } from 'axios';
import DataTable from '../components/DataTable';
import { useUsers, useUpdateUser } from '../hooks/useUsers';
import type { ManagedUser } from '../types/entities';
import type { Role } from '../types/auth';

const ROLES: Role[] = ['ADMIN', 'PM', 'MEMBER', 'VIEWER'];

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const updateUser = useUpdateUser();

  async function handleRoleChange(user: ManagedUser, role: Role) {
    try {
      await updateUser.mutateAsync({ id: user.id, input: { role } });
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to update role' : 'Failed to update role');
    }
  }

  async function handleToggleActive(user: ManagedUser) {
    try {
      await updateUser.mutateAsync({ id: user.id, input: { isActive: !user.isActive } });
    } catch (err) {
      alert(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to update user' : 'Failed to update user');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <DataTable
          rows={users ?? []}
          rowKey={(u) => u.id}
          emptyMessage="No users yet."
          columns={[
            { key: 'name', header: 'Name', render: (u) => u.name },
            { key: 'email', header: 'Email', render: (u) => u.email },
            {
              key: 'role',
              header: 'Role',
              render: (u) => (
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (u) => (
                <button
                  onClick={() => handleToggleActive(u)}
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    u.isActive
                      ? 'border-green-700 text-green-400 hover:bg-green-950'
                      : 'border-slate-700 text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {u.isActive ? 'Active' : 'Inactive'}
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
