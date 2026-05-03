import { LockKeyhole, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';

import { login } from '../api/auth.api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const data = await login(username, password);

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.user.role);

      window.location.href = '/dashboard';
    } catch (loginError) {
      console.error(loginError);
      setError("Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  return (
    <main className="app-shell soft-grid flex min-h-screen items-center justify-center p-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="surface w-full max-w-md rounded-lg p-7"
      >
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
            GC
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              Gestion Contrats
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Connexion securisee
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="relative block">
            <UserRound
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="control h-12 w-full rounded-lg pl-10 pr-4 text-sm font-bold"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="relative block">
            <LockKeyhole
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              className="control h-12 w-full rounded-lg pl-10 pr-4 text-sm font-bold"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}

          <button className="h-12 w-full cursor-pointer rounded-lg bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800">
            Login
          </button>
        </form>
      </motion.section>
    </main>
  );
}
