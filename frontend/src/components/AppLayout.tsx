import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-slate-100 text-slate-900 font-medium dark:bg-slate-800 dark:text-white'
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
  }`;

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg px-3 py-1.5 dark:text-slate-400 dark:hover:text-white dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.05a1 1 0 011.41 1.41l-.7.71a1 1 0 11-1.42-1.42l.71-.7zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zm-2.05 4.22a1 1 0 011.42 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-2.05a1 1 0 01-1.41 1.41l.7-.7a1 1 0 111.42 1.41l-.71-.71zM4 9a1 1 0 110 2H3a1 1 0 110-2h1zm.76-4.24a1 1 0 011.41-1.41l.71.7a1 1 0 11-1.41 1.42l-.71-.71zM10 6a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          Light mode
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          Dark mode
        </>
      )}
    </button>
  );
}

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
        <h1 className="text-slate-900 dark:text-white font-bold text-lg mb-6 px-2">Progress Tracker</h1>
        <nav className="space-y-1 flex-1">
          <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/projects" className={navLinkClass}>Projects</NavLink>
          {canManage && (
            <>
              <NavLink to="/clients" className={navLinkClass}>Clients</NavLink>
              <NavLink to="/teams" className={navLinkClass}>Teams</NavLink>
              <NavLink to="/users" className={navLinkClass}>Users</NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2">
          <ThemeToggle />
          <p className="text-xs text-slate-500 px-2 truncate">{user?.name} · {user?.role}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg px-3 py-1.5 dark:text-slate-400 dark:hover:text-white dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 text-slate-900 dark:text-white">
        <Outlet />
      </main>
    </div>
  );
}
