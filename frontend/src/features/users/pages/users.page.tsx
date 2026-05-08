import { motion } from 'framer-motion';
import { Search, ShieldCheck, Trash2, UserPlus, UsersRound, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import { getProfile } from '../../auth/api/auth.api';
import {
  deleteUser,
  getUsers,
  inviteUser,
  updateUserRole,
  type InviteUserData,
  type User,
  type UserRole,
} from '../api/users.api';

type CurrentUser = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
};

const roleBadgeClass: Record<UserRole, string> = {
  ADMIN: 'bg-teal-50 text-teal-700 ring-teal-100',
  USER: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const [form, setForm] = useState<InviteUserData>({
    email: '',
  });

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => toast.error('Erreur lors du chargement des utilisateurs'));

    getProfile()
      .then(setCurrentUser)
      .catch(() => toast.error('Erreur lors du chargement du profil'));
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const invitation = await inviteUser(form);

      setForm({
        email: '',
      });
      setShowForm(false);
      toast.success(
        invitation.emailSent
          ? 'Invitation envoyee avec succes'
          : 'Invitation creee, mais email non envoye',
      );
    } catch {
      toast.error("Erreur lors de la creation de l'utilisateur");
    }
  };

  const handleRoleChange = async (id: number, role: UserRole) => {
    try {
      const updatedUser = await updateUserRole(id, role);

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? updatedUser : user)),
      );

      toast.success('Role modifie avec succes');
    } catch {
      toast.error('Erreur lors de la modification du role');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete);

      setUsers((prev) => prev.filter((user) => user.id !== userToDelete));
      setUserToDelete(null);
      toast.success('Utilisateur supprime avec succes');
    } catch {
      toast.error("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    const matchesSearch =
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((user) => user.role === 'ADMIN').length;
  const standardCount = users.filter((user) => user.role === 'USER').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-teal-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Utilisateurs
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Gere les acces, les roles et les comptes de l'application.
          </p>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm ? 'Fermer' : 'Ajouter utilisateur'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total utilisateurs', value: users.length, icon: UsersRound },
          { label: 'Administrateurs', value: adminCount, icon: ShieldCheck },
          { label: 'Utilisateurs standards', value: standardCount, icon: UsersRound },
        ].map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="surface rounded-lg p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={20} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showForm && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="surface rounded-lg p-5"
        >
          <h2 className="mb-4 text-lg font-black text-slate-950">
            Inviter un utilisateur
          </h2>

          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="control h-11 rounded-lg px-4 text-sm font-bold md:col-span-2"
            />

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="h-10 cursor-pointer rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Envoyer invitation
              </button>
            </div>
          </form>
        </motion.section>
      )}

      <section className="surface rounded-lg p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher nom, username ou email..."
              className="control h-11 w-full rounded-lg pl-10 pr-4 text-sm font-medium"
            />
          </label>

          <div className="flex gap-2">
            {(['ALL', 'ADMIN', 'USER'] as const).map((role) => {
              const isActive = roleFilter === role;

              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`h-10 cursor-pointer rounded-lg px-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-900/10'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {role === 'ALL' ? 'Tous' : role}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Nom
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Username
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Email
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Role
                </th>
                <th className="px-5 py-4 text-right text-xs font-black uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user, index) => {
                const isMe = currentUser?.id === user.id;

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className="border-b border-slate-100 bg-white/70 transition hover:bg-white"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                          {user.fullName
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-950">
                            {user.fullName}
                            {isMe && (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                Vous
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-600">
                      {user.username}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-600">
                      {user.email}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`status-pill ring-1 ${roleBadgeClass[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <select
                          value={user.role}
                          disabled={isMe}
                          onChange={(event) =>
                            handleRoleChange(user.id, event.target.value as UserRole)
                          }
                          className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        <button
                          disabled={isMe}
                          onClick={() => setUserToDelete(user.id)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-sm font-medium text-slate-500">
            Aucun utilisateur trouve.
          </div>
        )}
      </section>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="surface w-full max-w-sm rounded-lg p-6"
          >
            <h2 className="text-lg font-black text-slate-950">
              Supprimer cet utilisateur ?
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Cette action est irreversible. Le compte ne pourra plus acceder a
              l'application.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                onClick={confirmDelete}
                className="h-10 cursor-pointer rounded-lg bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
