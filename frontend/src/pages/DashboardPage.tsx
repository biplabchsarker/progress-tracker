import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-400 text-sm">Signed in as {user?.name} ({user?.email})</p>
      <p className="text-slate-500 text-sm mt-1">Role-specific dashboards ship in M3.</p>
    </div>
  );
}
