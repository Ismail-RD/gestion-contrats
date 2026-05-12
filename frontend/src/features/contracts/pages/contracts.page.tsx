import { Ban, Download, FilePlus2, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import {
  deleteContract,
  getContracts,
  terminateContract,
  type Contract,
} from '../api/contracts.api';

const statusOptions = [
  { value: 'ALL', label: 'Tous' },
  { value: 'UNSIGNED', label: 'Non signes' },
  { value: 'ACTIVE', label: 'Actifs' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'EXPIRED', label: 'Expires' },
  { value: 'TERMINATED', label: 'Resilies' },
];

const statusClasses: Record<Contract['status'], string> = {
  UNSIGNED: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-100',
  TERMINATED: 'bg-amber-50 text-amber-700 ring-amber-100',
};

const statusLabels: Record<Contract['status'], string> = {
  UNSIGNED: 'Non signe',
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  EXPIRED: 'Expire',
  TERMINATED: 'Resilie',
};

export default function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [contractToDelete, setContractToDelete] = useState<number | null>(null);
  const [contractToTerminate, setContractToTerminate] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const itemsPerPage = 6;

  useEffect(() => {
    getContracts().then(setContracts);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredContracts = contracts.filter((contract) => {
    const query = search.toLowerCase();
    const matchesSearch =
      contract.title.toLowerCase().includes(query) ||
      contract.clientName.toLowerCase().includes(query) ||
      contract.contractNumber.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContracts.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      await deleteContract(contractToDelete);
      setContracts((prev) =>
        prev.filter((contract) => contract.id !== contractToDelete),
      );
      toast.success('Contrat supprime avec succes');
      setContractToDelete(null);
    } catch {
      toast.error('Erreur lors de la suppression du contrat');
    }
  };

  const confirmTerminate = async () => {
    if (!contractToTerminate) return;

    try {
      const updatedContract = await terminateContract(contractToTerminate);
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === contractToTerminate ? updatedContract : contract,
        ),
      );
      toast.success('Contrat resilie avec succes');
      setContractToTerminate(null);
    } catch {
      toast.error('Erreur lors de la resiliation du contrat');
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Titre',
      'Numero',
      'Client',
      'Montant',
      'Statut',
      'Date debut',
      'Date fin',
    ];

    const rows = filteredContracts.map((contract) => [
      contract.title,
      contract.contractNumber,
      contract.clientName,
      contract.amount,
      contract.status,
      contract.startDate,
      contract.endDate,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contracts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

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
            Portefeuille
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Contrats
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {filteredContracts.length} contrat(s) affiches sur {contracts.length}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToCsv}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <Download size={18} />
            CSV
          </button>

          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <FilePlus2 size={18} />
            Ajouter
          </button>
        </div>
      </div>

      <section className="surface rounded-lg p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher titre, client ou numero..."
              className="control h-11 w-full rounded-lg pl-10 pr-4 text-sm font-medium"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = statusFilter === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`h-10 cursor-pointer rounded-lg px-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-900/10'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {option.label}
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
                  Contrat
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Client
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Montant
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase text-slate-500">
                  Statut
                </th>
                <th className="px-5 py-4 text-right text-xs font-black uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedContracts.map((contract, index) => (
                <motion.tr
                  key={contract.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  className="border-b border-slate-100 bg-white/70 transition hover:bg-white"
                >
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className="max-w-[280px] cursor-pointer truncate text-left font-black text-slate-950 transition hover:text-teal-700"
                    >
                      {contract.title}
                    </button>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      #{contract.contractNumber}
                    </p>
                  </td>

                  <td className="px-5 py-4 font-bold text-slate-700">
                    {contract.clientName}
                  </td>

                  <td className="px-5 py-4 font-black text-slate-950">
                    {Number(contract.amount).toLocaleString('fr-MA')} MAD
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`status-pill ring-1 ${statusClasses[contract.status]}`}
                    >
                      {statusLabels[contract.status]}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                      >
                        Voir
                      </button>

                      <button
                        onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                        className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Edit
                      </button>

                      {contract.status !== 'TERMINATED' && (
                        <button
                          onClick={() => setContractToTerminate(contract.id)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                          title="Resilier"
                        >
                          <Ban size={17} />
                        </button>
                      )}

                      <button
                        onClick={() => setContractToDelete(contract.id)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Supprimer"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedContracts.length === 0 && (
          <div className="p-8 text-center text-sm font-medium text-slate-500">
            Aucun contrat trouve.
          </div>
        )}
      </section>

      {filteredContracts.length > 0 && (
        <div className="surface flex items-center justify-between rounded-lg p-4">
          <p className="text-sm font-bold text-slate-500">
            Page {currentPage} sur {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Precedent
            </button>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {contractToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="surface w-full max-w-sm rounded-lg p-6"
          >
            <h2 className="text-lg font-black text-slate-950">
              Supprimer ce contrat ?
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Cette action est irreversible.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setContractToDelete(null)}
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

      {contractToTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="surface w-full max-w-sm rounded-lg p-6"
          >
            <h2 className="text-lg font-black text-slate-950">
              Resilier ce contrat ?
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Le contrat ne sera plus considere comme actif.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setContractToTerminate(null)}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                onClick={confirmTerminate}
                className="h-10 cursor-pointer rounded-lg bg-amber-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
              >
                Resilier
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
