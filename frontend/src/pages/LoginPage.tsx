import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { accessToken, user } = await login(email, password);
      setSession(accessToken, user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.error ?? 'Login failed'
        : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 w-full max-w-md dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Progress Tracker</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Sign in to your account</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-300 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300">Register</a>
        </p>
      </div>
    </div>
  );
}
