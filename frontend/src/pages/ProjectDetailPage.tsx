import { useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  useProject,
  useAddEngagement,
  useRemoveEngagement,
} from '../hooks/useProjects';
import { useTasks, useCreateTask, useUpdateTask, useAssignTask, useUnassignTask } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuthStore } from '../store/authStore';
import type { Task, TaskStatus } from '../types/entities';

const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED'];
const PROGRESS_STEPS = Array.from({ length: 21 }, (_, i) => i * 5);

function EngagementPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const { data: project } = useProject(projectId);
  const { data: users } = useUsers();
  const addEngagement = useAddEngagement(projectId);
  const removeEngagement = useRemoveEngagement(projectId);
  const [userId, setUserId] = useState('');
  const [pct, setPct] = useState(50);
  const [isBillable, setIsBillable] = useState(false);
  const [preview, setPreview] = useState<{ previousTotal: number; newTotal: number; isOverAllocated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engaged = project?.engagements ?? [];
  const availableUsers = (users ?? []).filter((u) => !engaged.some((e) => e.userId === u.id));

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;
    try {
      const result = await addEngagement.mutateAsync({ userId, engagementPct: pct, isBillable });
      setPreview(result);
      setUserId('');
      setPct(50);
      setIsBillable(false);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to add engagement' : 'Failed to add engagement');
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h2 className="font-semibold mb-3">Engagement roster</h2>

      <ul className="space-y-1 mb-4">
        {engaged.length ? (
          engaged.map((e) => (
            <li key={e.userId} className="flex items-center justify-between text-sm bg-slate-800 rounded-lg px-3 py-2">
              <span>
                {e.user.name} — <span className="font-medium">{e.engagementPct}%</span>
                {e.isBillable && <span className="text-teal-400 text-xs ml-2">billable</span>}
              </span>
              {canManage && (
                <button onClick={() => removeEngagement.mutate(e.userId)} className="text-red-400 hover:text-red-300 text-xs">
                  Remove
                </button>
              )}
            </li>
          ))
        ) : (
          <li className="text-slate-500 text-sm">No one engaged yet.</li>
        )}
      </ul>

      {canManage && (
        <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Add engagement</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[160px]">
              <option value="">Select a user…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Engagement %</label>
            <input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white w-20" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 pb-2">
            <input type="checkbox" checked={isBillable} onChange={(e) => setIsBillable(e.target.checked)} />
            Billable
          </label>
          <button type="submit" disabled={!userId || addEngagement.isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
            Add
          </button>
          {error && <p className="text-red-400 text-xs w-full">{error}</p>}
          {preview && (
            <p className={`text-xs w-full ${preview.isOverAllocated ? 'text-amber-400' : 'text-slate-500'}`}>
              User's total engagement: {preview.previousTotal}% → {preview.newTotal}%
              {preview.isOverAllocated && ' — over-allocated'}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function TaskRow({
  task,
  indent,
  onUpdateStatus,
  onUpdateProgress,
  onAssign,
  onUnassign,
  availableUsers,
}: {
  task: Task;
  indent: boolean;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateProgress: (taskId: string, progressPct: number) => void;
  onAssign: (taskId: string, userId: string) => void;
  onUnassign: (taskId: string, userId: string) => void;
  availableUsers: { id: string; name: string }[];
}) {
  const [assignee, setAssignee] = useState('');

  return (
    <li className={`bg-slate-800 rounded-lg px-3 py-2 ${indent ? 'ml-8' : ''}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm">{task.title}</span>
        <div className="flex items-center gap-2">
          <select value={task.status} onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={task.progressPct} onChange={(e) => onUpdateProgress(task.id, Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
            {PROGRESS_STEPS.map((p) => (
              <option key={p} value={p}>{p}%</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {task.assignments.map((a) => (
          <span key={a.userId} className="text-xs bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 flex items-center gap-1">
            {a.user.name}
            <button onClick={() => onUnassign(task.id, a.userId)} className="text-red-400 hover:text-red-300">×</button>
          </span>
        ))}
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white">
          <option value="">Assign…</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <button
          disabled={!assignee}
          onClick={() => { onAssign(task.id, assignee); setAssignee(''); }}
          className="text-blue-400 hover:text-blue-300 disabled:opacity-40 text-xs"
        >
          Add
        </button>
      </div>
    </li>
  );
}

function TasksPanel({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading } = useTasks(projectId, true);
  const { data: users } = useUsers();
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const assignTask = useAssignTask(projectId);
  const unassignTask = useUnassignTask(projectId);

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createTask.mutateAsync({ title });
      setTitle('');
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? 'Failed to create task' : 'Failed to create task');
    }
  }

  const topLevel = (tasks ?? []).filter((t) => !t.parentTaskId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mt-4">
      <h2 className="font-semibold mb-3">Tasks</h2>

      <form onSubmit={handleCreate} className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">New task</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[240px]" />
        </div>
        <button type="submit" disabled={createTask.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
          Add task
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-slate-500 text-sm">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {topLevel.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              indent={false}
              availableUsers={users ?? []}
              onUpdateStatus={(taskId, status) => updateTask.mutate({ taskId, input: { status } })}
              onUpdateProgress={(taskId, progressPct) => updateTask.mutate({ taskId, input: { progressPct } })}
              onAssign={(taskId, userId) => assignTask.mutate({ taskId, userId, engagementPct: 100 })}
              onUnassign={(taskId, userId) => unassignTask.mutate({ taskId, userId })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id ?? '');
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM';

  if (isLoading || !project) {
    return <p className="text-slate-500 text-sm">Loading…</p>;
  }

  const showTasks = project.category === 'INTERNAL' || project.tasksEnabled;

  return (
    <div>
      <Link to="/projects" className="text-slate-500 hover:text-white text-xs">← Back to projects</Link>
      <div className="flex items-center gap-3 mt-2 mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">{project.category}</span>
        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">{project.status}</span>
      </div>

      <EngagementPanel projectId={project.id} canManage={canManage} />
      {showTasks && <TasksPanel projectId={project.id} />}
    </div>
  );
}
