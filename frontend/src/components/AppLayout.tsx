import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
  }`;

export default function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM';

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-56 shrink-0 border-r border-slate-800 p-4 flex flex-col">
        <h1 className="text-white font-bold text-lg mb-6 px-2">Progress Tracker</h1>
        <nav className="space-y-1 flex-1">
          <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
          {canManage && (
            <>
              <NavLink to="/clients" className={navLinkClass}>Clients</NavLink>
              <NavLink to="/teams" className={navLinkClass}>Teams</NavLink>
              <NavLink to="/users" className={navLinkClass}>Users</NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-slate-800 pt-3 mt-3">
          <p className="text-xs text-slate-500 px-2 mb-2 truncate">{user?.name} · {user?.role}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 text-white">
        <Outlet />
      </main>
    </div>
  );
}
