import { ArrowLeft, Ban, Download, Mail, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import {
  downloadContractPdf,
  getContractById,
  resendSignatureEmail,
  terminateContract,
  type Contract,
} from '../api/contracts.api';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-MA', {
    dateStyle: 'medium',
    timeZone: 'Africa/Casablanca',
  }).format(new Date(date));
}

function getStatusClass(status: Contract['status']) {
  switch (status) {
    case 'UNSIGNED':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-100';
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'EXPIRED':
      return 'bg-rose-50 text-rose-700 ring-rose-100';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 ring-slate-200';
    case 'TERMINATED':
      return 'bg-amber-50 text-amber-700 ring-amber-100';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

const statusLabels: Record<Contract['status'], string> = {
  UNSIGNED: 'Non signe',
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  EXPIRED: 'Expire',
  TERMINATED: 'Resilie',
};

export default function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isSendingSignature, setIsSendingSignature] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;

    getContractById(Number(id)).then(setContract);
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!contract) return;

    const blob = await downloadContractPdf(contract.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrat-${contract.contractNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendSignature = async () => {
    if (!contract) return;

    setIsSendingSignature(true);
    try {
      const updatedContract = await resendSignatureEmail(contract.id);
      setContract(updatedContract);
      toast.success(
        updatedContract.emailSent
          ? 'Email de signature envoye'
          : 'Lien de signature prepare',
      );

      if (updatedContract.signatureUrl) {
        try {
          await navigator.clipboard?.writeText(updatedContract.signatureUrl);
          toast.success('Lien copie dans le presse-papiers');
        } catch {
          console.info('Lien de signature:', updatedContract.signatureUrl);
        }
      }
    } catch {
      toast.error("Impossible de preparer le lien de signature");
    } finally {
      setIsSendingSignature(false);
    }
  };

  const handleTerminate = async () => {
    if (!contract) return;

    setIsTerminating(true);
    try {
      const updatedContract = await terminateContract(contract.id);
      setContract(updatedContract);
      setShowTerminateConfirm(false);
      toast.success('Contrat resilie avec succes');
    } catch {
      toast.error('Erreur lors de la resiliation du contrat');
    } finally {
      setIsTerminating(false);
    }
  };

  if (!contract) {
    return (
      <div className="surface rounded-lg p-8">
        <p className="text-sm font-medium text-slate-500">
          Chargement du contrat...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => navigate('/contracts')}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Retour aux contrats
          </button>

          <p className="text-sm font-bold uppercase text-blue-700">
            Fiche contrat
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {contract.title}
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Contrat #{contract.contractNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            title="Telecharger le PDF"
          >
            <Download size={18} />
            PDF
          </button>

          {!contract.signedAt && contract.status !== 'TERMINATED' && (
            <button
              onClick={handleSendSignature}
              disabled={isSendingSignature}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              title="Envoyer le lien de signature"
            >
              <Mail size={18} />
              Signature
            </button>
          )}

          {contract.status !== 'TERMINATED' && (
            <button
              onClick={() => setShowTerminateConfirm(true)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-50"
              title="Resilier le contrat"
            >
              <Ban size={18} />
              Resilier
            </button>
          )}

          <button
            onClick={() => navigate(`/contracts/${contract.id}/edit`)}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil size={18} />
            Modifier
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface rounded-lg p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Informations du contrat
            </h2>

            <span
              className={`status-pill ring-1 ${getStatusClass(
                contract.status,
              )}`}
            >
              {statusLabels[contract.status]}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-slate-500">Client</p>
              <p className="mt-1 font-black text-slate-950">
                {contract.clientName}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">CIN</p>
              <p className="mt-1 font-medium text-slate-800">
                {contract.clientCin || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Email</p>
              <p className="mt-1 font-medium text-slate-800">
                {contract.clientEmail || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Telephone</p>
              <p className="mt-1 font-medium text-slate-800">
                {contract.clientPhone || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Montant</p>
              <p className="mt-1 font-black text-slate-950">
                {Number(contract.amount).toLocaleString('fr-MA')} MAD
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Date de debut</p>
              <p className="mt-1 font-medium text-slate-800">
                {formatDate(contract.startDate)}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Date de fin</p>
              <p className="mt-1 font-medium text-slate-800">
                {formatDate(contract.endDate)}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-bold text-slate-500">Adresse</p>
              <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {contract.clientAddress || 'Aucune adresse'}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-bold text-slate-500">Description</p>
              <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {contract.description || 'Aucune description'}
              </p>
            </div>
          </div>
        </div>

        <div className="surface rounded-lg p-6">
          <h2 className="text-xl font-black text-slate-950">Suivi</h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Cree le</p>
              <p className="mt-1 font-medium text-slate-800">
                {formatDate(contract.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Modifie le</p>
              <p className="mt-1 font-medium text-slate-800">
                {formatDate(contract.updatedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-500">Signature</p>
              <p className="mt-1 font-medium text-slate-800">
                {contract.signedAt
                  ? `${contract.signerName || contract.clientName} - ${formatDate(
                      contract.signedAt,
                    )}`
                  : 'En attente'}
              </p>
            </div>

            {'createdBy' in contract && contract.createdBy && (
              <div>
                <p className="text-sm font-bold text-slate-500">Cree par</p>
                <p className="mt-1 font-medium text-slate-800">
                  {contract.createdBy.fullName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTerminateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-sm rounded-lg p-6">
            <h2 className="text-lg font-black text-slate-950">
              Resilier ce contrat ?
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Le contrat ne sera plus considere comme actif.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                disabled={isTerminating}
                className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>

              <button
                onClick={handleTerminate}
                disabled={isTerminating}
                className="h-10 cursor-pointer rounded-lg bg-amber-600 px-4 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resilier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
