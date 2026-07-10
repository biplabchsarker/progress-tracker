import { useState, FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DataTable from '../components/DataTable';
import { useTeams, useTeam, useCreateTeam, useAddTeamMember, useRemoveTeamMember } from '../hooks/useTeams';
import { useUsers } from '../hooks/useUsers';
import type { TeamRole } from '../types/entities';

function TeamDetail({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const { data: team } = useTeam(teamId);
  const { data: users } = useUsers();
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);
  const [userId, setUserId] = useState('');
  const [teamRole, setTeamRole] = useState<TeamRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);

  const availableUsers = (users ?? []).filter(
    (u) => !team?.members?.some((m) => m.userId === u.id),
  );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;
    try {
      await addMember.mutateAsync({ userId, teamRole });
      setUserId('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to add member' : 'Failed to add member');
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{team?.name} — Members</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">Close</button>
      </div>

      <ul className="space-y-1 mb-4">
        {team?.members?.length ? (
          team.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between text-sm bg-slate-800 rounded-lg px-3 py-2">
              <span>{m.user.name} <span className="text-slate-500">({m.teamRole})</span></span>
              <button
                onClick={() => removeMember.mutate(m.userId)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Remove
              </button>
            </li>
          ))
        ) : (
          <li className="text-slate-500 text-sm">No members yet.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Add member</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[180px]">
            <option value="">Select a user…</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Team role</label>
          <select value={teamRole} onChange={(e) => setTeamRole(e.target.value as TeamRole)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="MEMBER">MEMBER</option>
            <option value="LEAD">LEAD</option>
          </select>
        </div>
        <button type="submit" disabled={!userId || addMember.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
          Add
        </button>
        {error && <p className="text-red-400 text-xs w-full">{error}</p>}
      </form>
    </div>
  );
}

export default function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createTeam.mutateAsync({ name, description: description || undefined });
      setName('');
      setDescription('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to create team' : 'Failed to create team');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Teams</h1>

      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
        </div>
        <button type="submit" disabled={createTeam.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
          Add team
        </button>
        {error && <p className="text-red-400 text-xs w-full">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <DataTable
          rows={teams ?? []}
          rowKey={(t) => t.id}
          emptyMessage="No teams yet."
          columns={[
            { key: 'name', header: 'Name', render: (t) => t.name },
            { key: 'description', header: 'Description', render: (t) => t.description ?? '—' },
            { key: 'members', header: 'Members', render: (t) => t._count?.members ?? 0 },
            {
              key: 'actions',
              header: '',
              render: (t) => (
                <button onClick={() => setOpenTeamId(t.id)} className="text-blue-400 hover:text-blue-300 text-xs">
                  Manage members
                </button>
              ),
            },
          ]}
        />
      )}

      {openTeamId && <TeamDetail teamId={openTeamId} onClose={() => setOpenTeamId(null)} />}
    </div>
  );
}
