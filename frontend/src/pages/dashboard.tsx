import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  PenLine,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getProfile } from '../features/auth/api/auth.api';
import {
  getContractStats,
  type ContractStats,
  type Contract,
  getExpiringSoonContracts,
  getContracts,
} from '../features/contracts/api/contracts.api';

type UserProfile = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
};

const statusLabels: Record<Contract['status'], string> = {
  UNSIGNED: 'Non signe',
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  EXPIRED: 'Expire',
  TERMINATED: 'Resilie',
};

const statusClasses: Record<Contract['status'], string> = {
  UNSIGNED: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-100',
  TERMINATED: 'bg-amber-50 text-amber-700 ring-amber-100',
};

const chartColors = ['#2563eb', '#0891b2', '#e11d48', '#f59e0b', '#64748b'];

function monthLabel(date: string) {
  return new Intl.DateTimeFormat('fr-MA', {
    month: 'short',
    timeZone: 'Africa/Casablanca',
  }).format(new Date(date));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-MA', {
    dateStyle: 'medium',
    timeZone: 'Africa/Casablanca',
  }).format(new Date(date));
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getExpiringSoonContracts().then(setExpiringContracts);
    getProfile().then(setUser);
    getContractStats().then(setStats);
    getContracts().then(setContracts);
  }, []);

  const recentContracts = contracts.slice(0, 5);
  const activeAmount = contracts
    .filter((contract) => contract.status === 'ACTIVE')
    .reduce((sum, contract) => sum + Number(contract.amount), 0);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat('fr-MA', {
          month: 'short',
          timeZone: 'Africa/Casablanca',
        }).format(date),
        total: 0,
        signes: 0,
      };
    });

    contracts.forEach((contract) => {
      const created = new Date(contract.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (month) {
        month.total += 1;
        if (contract.signedAt) {
          month.signes += 1;
        }
      }
    });

    return months;
  }, [contracts]);

  if (!user || !stats) {
    return (
      <div className="surface rounded-lg p-8">
        <p className="text-sm font-medium text-slate-500">
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total contrats',
      value: stats.total,
      icon: FileText,
      tone: 'text-slate-950',
      accent: 'bg-slate-900',
      iconBox: 'bg-slate-100 text-slate-700',
      spark: monthlyData.map((item) => item.total),
      stroke: '#172033',
      fill: '#e2e8f0',
    },
    {
      label: 'Contrats actifs',
      value: stats.active,
      icon: CheckCircle2,
      tone: 'text-emerald-700',
      accent: 'bg-emerald-500',
      iconBox: 'bg-emerald-50 text-emerald-700',
      spark: [1, 2, 2, 3, 4, stats.active],
      stroke: '#059669',
      fill: '#d1fae5',
    },
    {
      label: 'Non signes',
      value: stats.unsigned ?? 0,
      icon: PenLine,
      tone: 'text-cyan-700',
      accent: 'bg-cyan-500',
      iconBox: 'bg-cyan-50 text-cyan-700',
      spark: [2, 3, 2, 4, 3, stats.unsigned ?? 0],
      stroke: '#0891b2',
      fill: '#cffafe',
    },
    {
      label: 'Expires',
      value: stats.expired,
      icon: AlertTriangle,
      tone: 'text-rose-700',
      accent: 'bg-rose-500',
      iconBox: 'bg-rose-50 text-rose-700',
      spark: [0, 1, 1, 2, 2, stats.expired],
      stroke: '#e11d48',
      fill: '#ffe4e6',
    },
  ];

  const repartitionData = [
    { name: 'Actifs', value: stats.active },
    { name: 'Non signes', value: stats.unsigned ?? 0 },
    { name: 'Expires', value: stats.expired },
    { name: 'Resilies', value: stats.terminated },
    { name: 'Brouillons', value: stats.draft },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="surface flex flex-col gap-5 rounded-lg p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-blue-700">
            Pilotage contrats
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Tableau de bord
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            Bienvenue, {user.fullName}. Vue consolidee des contrats clients.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-black uppercase text-blue-700">
              Montant actif
            </p>
            <p className="mt-1 text-lg font-black text-slate-950">
              {activeAmount.toLocaleString('fr-MA')} MAD
            </p>
          </div>

          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            <FileText size={18} />
            Nouveau contrat
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const sparkData = card.spark.map((value, sparkIndex) => ({
            name: sparkIndex,
            value,
          }));

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.38 }}
              className="surface relative overflow-hidden rounded-lg p-5"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {card.label}
                  </p>
                  <p className={`mt-2 text-3xl font-black ${card.tone}`}>
                    {card.value}
                  </p>
                </div>

                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBox}`}>
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={card.stroke}
                      fill={card.fill}
                      strokeWidth={2}
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <section className="surface rounded-lg p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Evolution mensuelle
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Creation et signatures sur les six derniers mois.
              </p>
            </div>
            <Activity className="text-blue-700" size={22} />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="contractsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="signedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 16px 34px rgba(15,23,42,0.12)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Contrats"
                  stroke="#2563eb"
                  fill="url(#contractsFill)"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="signes"
                  name="Signes"
                  stroke="#2563eb"
                  fill="url(#signedFill)"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-950">
              Repartition
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Contrats par statut.
            </p>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repartitionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={4}
                >
                  {repartitionData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-2">
            {repartitionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: chartColors[index] }}
                  />
                  {item.name}
                </div>
                <span className="font-black text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface rounded-lg p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Contrats recents
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Dernieres activites enregistrees.
              </p>
            </div>

            <button
              onClick={() => navigate('/contracts')}
              className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {recentContracts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-medium text-slate-500">
                Aucun contrat recent.
              </div>
            ) : (
              recentContracts.map((contract, index) => (
                <motion.button
                  key={contract.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {contract.title}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">
                      {contract.clientName} - #{contract.contractNumber}
                    </p>
                  </div>

                  <span
                    className={`status-pill shrink-0 ring-1 ${statusClasses[contract.status]}`}
                  >
                    {statusLabels[contract.status]}
                  </span>
                </motion.button>
              ))
            )}
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Proches expiration
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Contrats a suivre dans les 30 jours.
              </p>
            </div>

            <span className="status-pill bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              {expiringContracts.length}
            </span>
          </div>

          <div className="space-y-3">
            {expiringContracts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-medium text-slate-500">
                Aucun contrat proche de l'expiration.
              </div>
            ) : (
              expiringContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/75 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {contract.title}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">
                      {contract.clientName} - {monthLabel(contract.endDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm font-black text-amber-700">
                      <Clock3 size={16} />
                      {formatDate(contract.endDate)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
