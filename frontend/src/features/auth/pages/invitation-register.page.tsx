import { LockKeyhole, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { completeInvitation } from '../api/auth.api';

export default function InvitationRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Lien d'invitation invalide");
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await completeInvitation(token, username, password);
      setIsComplete(true);
      window.setTimeout(() => navigate('/'), 1400);
    } catch (registerError) {
      console.error(registerError);
      setError("Impossible de finaliser l'inscription");
    } finally {
      setIsSubmitting(false);
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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-sm font-black text-white shadow-lg shadow-teal-900/15">
            GC
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              Creation du compte
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Choisissez vos identifiants
            </p>
          </div>
        </div>

        {isComplete ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-bold text-teal-700">
              Compte cree avec succes. Redirection vers la connexion...
            </div>
            <Link
              to="/"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-teal-700 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800"
            >
              Aller a la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <label className="relative block">
              <UserRound
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="control h-12 w-full rounded-lg pl-10 pr-4 text-sm font-bold"
                placeholder="Nom d'utilisateur"
                value={username}
                minLength={3}
                required
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
                placeholder="Mot de passe"
                value={password}
                minLength={6}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer rounded-lg bg-teal-700 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>
        )}
      </motion.section>
    </main>
  );
}
