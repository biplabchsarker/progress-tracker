import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatTile from '../components/StatTile';
import EngagementBar, { EngagementLegend } from '../components/EngagementBar';
import CategoryBadge from '../components/CategoryBadge';
import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../store/authStore';
import type {
  AdminDashboard,
  ClientProjectSummary,
  InternalProjectHealth,
  MemberDashboard,
  MyTask,
  PmDashboard,
  ViewerDashboard,
  ViewerProject,
} from '../types/dashboard';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function SectionHeader({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
      <span className={`w-1 h-4 rounded-full ${accent}`} />
      {children}
    </h3>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-colors hover:border-slate-700">{children}</div>;
}

function ClientProjectsPanel({ projects }: { projects: ClientProjectSummary[] }) {
  return (
    <Panel>
      <SectionHeader accent="bg-teal-500">Client projects</SectionHeader>
      <DataTable
        rows={projects}
        rowKey={(p) => p.id}
        emptyMessage="No client projects."
        columns={[
          { key: 'name', header: 'Name', render: (p) => <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">{p.name}</Link> },
          { key: 'client', header: 'Client', render: (p) => p.clientName ?? '—' },
          { key: 'headcount', header: 'Engaged', render: (p) => p.headcount },
        ]}
      />
    </Panel>
  );
}

function InternalProjectsPanel({ projects }: { projects: InternalProjectHealth[] }) {
  return (
    <Panel>
      <SectionHeader accent="bg-purple-500">Internal projects</SectionHeader>
      <DataTable
        rows={projects}
        rowKey={(p) => p.id}
        emptyMessage="No internal projects."
        columns={[
          { key: 'name', header: 'Name', render: (p) => <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">{p.name}</Link> },
          { key: 'progress', header: 'Progress', render: (p) => `${p.progressPct}%` },
          {
            key: 'overdue',
            header: 'Overdue',
            render: (p) => (p.overdueCount > 0 ? <span className="text-red-400 font-medium">{p.overdueCount}</span> : '0'),
          },
          { key: 'deadline', header: 'Deadline', render: (p) => formatDate(p.endDate) },
        ]}
      />
    </Panel>
  );
}

function AdminView({ data }: { data: AdminDashboard }) {
  const { summary, employees, clientProjects, internalProjects } = data;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Total headcount" value={summary.totalHeadcount} tone="blue" />
        <StatTile label="On client work" value={summary.onClientCount} tone="teal" />
        <StatTile label="Internal only" value={summary.internalOnlyCount} tone="purple" />
        <StatTile
          label="Over-allocated"
          value={summary.overAllocatedCount}
          hint={summary.overAllocatedCount > 0 ? 'needs attention' : 'all clear'}
          tone={summary.overAllocatedCount > 0 ? 'red' : 'green'}
        />
        <StatTile label="Avg utilization" value={`${summary.avgUtilization}%`} tone="blue" meterPct={summary.avgUtilization} />
      </div>

      <Panel>
        <SectionHeader accent="bg-blue-500">Employee engagement</SectionHeader>
        <EngagementLegend />
        <div className="space-y-2.5">
          {employees.map((e) => (
            <EngagementBar key={e.id} label={e.name} clientPct={e.clientPct} internalPct={e.internalPct} total={e.total} />
          ))}
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        <ClientProjectsPanel projects={clientProjects} />
        <InternalProjectsPanel projects={internalProjects} />
      </div>
    </div>
  );
}

function PmView({ data }: { data: PmDashboard }) {
  const { summary, clientProjects, internalProjects } = data;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        <StatTile label="Active projects" value={summary.activeProjectCount} tone="blue" />
        <StatTile
          label="Overdue tasks"
          value={summary.overdueTaskCount}
          tone={summary.overdueTaskCount > 0 ? 'red' : 'green'}
          hint={summary.overdueTaskCount > 0 ? 'needs attention' : 'all clear'}
        />
        <StatTile label="Overall progress" value={`${summary.overallProgress}%`} tone="blue" meterPct={summary.overallProgress} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <ClientProjectsPanel projects={clientProjects} />
        <InternalProjectsPanel projects={internalProjects} />
      </div>
    </div>
  );
}

function MemberView({ data }: { data: MemberDashboard }) {
  const { summary, myTasks } = data;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
        <StatTile label="Total engagement" value={`${summary.totalEngagement}%`} tone="blue" meterPct={summary.totalEngagement} />
        <StatTile label="Client work" value={`${summary.clientPct}%`} tone="teal" />
        <StatTile label="Internal work" value={`${summary.internalPct}%`} tone="purple" />
        <StatTile
          label="Overdue tasks"
          value={summary.overdueTaskCount}
          tone={summary.overdueTaskCount > 0 ? 'red' : 'green'}
          hint={summary.overdueTaskCount > 0 ? 'needs attention' : 'all clear'}
        />
      </div>

      <Panel>
        <SectionHeader accent="bg-blue-500">My engagements</SectionHeader>
        <EngagementLegend />
        <EngagementBar label="You" clientPct={summary.clientPct} internalPct={summary.internalPct} total={summary.totalEngagement} />
      </Panel>

      <div>
        <SectionHeader accent="bg-purple-500">My tasks (internal)</SectionHeader>
        <DataTable
          rows={myTasks}
          rowKey={(t: MyTask) => t.id}
          emptyMessage="No tasks assigned."
          columns={[
            { key: 'title', header: 'Task', render: (t) => t.title },
            { key: 'project', header: 'Project', render: (t) => t.projectName },
            { key: 'status', header: 'Status', render: (t) => t.status },
            { key: 'progress', header: 'Progress', render: (t) => `${t.progressPct}%` },
            {
              key: 'due',
              header: 'Due',
              render: (t) =>
                t.isOverdue ? (
                  <span className="text-red-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> overdue
                  </span>
                ) : (
                  formatDate(t.dueDate)
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function ViewerView({ data }: { data: ViewerDashboard }) {
  return (
    <Panel>
      <DataTable
        rows={data.projects}
        rowKey={(p: ViewerProject) => p.id}
        emptyMessage="No projects yet."
        columns={[
          { key: 'name', header: 'Name', render: (p) => p.name },
          { key: 'category', header: 'Category', render: (p) => <CategoryBadge category={p.category} /> },
          { key: 'status', header: 'Status', render: (p) => p.status },
          { key: 'progress', header: 'Progress', render: (p) => (p.progressPct === null ? '—' : `${p.progressPct}%`) },
          {
            key: 'overdue',
            header: 'Overdue',
            render: (p) => (p.overdueCount === null ? '—' : p.overdueCount > 0 ? <span className="text-red-400 font-medium">{p.overdueCount}</span> : '0'),
          },
        ]}
      />
    </Panel>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return <p className="text-slate-500 text-sm">Loading…</p>;
  }
  if (isError || !data) {
    return <p className="text-red-400 text-sm">Failed to load dashboard.</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Signed in as {user?.name} ({user?.email})</p>
      </div>

      {data.role === 'ADMIN' && <AdminView data={data} />}
      {data.role === 'PM' && <PmView data={data} />}
      {data.role === 'MEMBER' && <MemberView data={data} />}
      {data.role === 'VIEWER' && <ViewerView data={data} />}
    </div>
  );
}
