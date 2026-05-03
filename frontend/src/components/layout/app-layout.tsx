import { BarChart3, FileText, LogOut, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getProfile } from '../../features/auth/api/auth.api';

type UserProfile = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getProfile()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/');
      });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const menu = [
    { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { label: 'Contrats', path: '/contracts', icon: FileText },
    ...(user?.role === 'ADMIN'
      ? [{ label: 'Utilisateurs', path: '/users', icon: Users }]
      : []),
  ];

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="app-shell flex min-h-screen text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200/80 bg-white/76 p-5 shadow-[8px_0_28px_rgba(15,23,42,0.04)] backdrop-blur-xl lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            GC
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-950">
              Gestion Contrats
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Client contracts
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-lg bg-slate-900"
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/72 px-5 backdrop-blur-xl md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Espace de travail
            </p>
            <h2 className="text-sm font-extrabold text-slate-950 md:text-base">
              {user?.fullName ?? 'Utilisateur'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                {user?.username}
              </p>
              <p className="text-xs font-medium text-slate-500">{user?.role}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-800 shadow-sm">
              {initials}
            </div>

            <button
              onClick={logout}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              title="Deconnexion"
            >
              <LogOut size={17} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
