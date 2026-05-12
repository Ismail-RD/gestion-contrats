import { Sparkles } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../../lib/axios';
import {
  generateContractDescription,
  getContractById,
  updateContract,
} from '../api/contracts.api';

type ContractForm = {
  title: string;
  contractNumber: string;
  clientCin: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  amount: string;
  startDate: string;
  endDate: string;
  description: string;
};

export default function EditContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<ContractForm | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  useEffect(() => {
    if (!id) return;

    getContractById(Number(id)).then((data) => {
      setForm({
        title: data.title,
        contractNumber: data.contractNumber,
        clientCin: data.clientCin ?? '',
        clientFirstName: data.clientFirstName ?? '',
        clientLastName: data.clientLastName ?? '',
        clientEmail: data.clientEmail ?? '',
        clientPhone: data.clientPhone ?? '',
        clientAddress: data.clientAddress ?? '',
        amount: String(data.amount),
        startDate: data.startDate.slice(0, 10),
        endDate: data.endDate.slice(0, 10),
        description: data.description ?? '',
      });
    });
  }, [id]);

  if (!form) return <p>Loading...</p>;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);

    try {
      const { description: existingDescription, ...contractFields } = form;
      const clientName =
        `${form.clientFirstName} ${form.clientLastName}`.trim();

      const { description } = await generateContractDescription({
        ...contractFields,
        clientName,
        amount: form.amount ? Number(form.amount) : undefined,
        existingDescription,
      });

      setForm((currentForm) =>
        currentForm
          ? {
              ...currentForm,
              description,
            }
          : currentForm,
      );
      toast.success('Description generee avec IA');
    } catch (generateError) {
      toast.error(
        getApiErrorMessage(
          generateError,
          "Impossible de generer la description pour l'instant",
        ),
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const clientName =
        `${form.clientFirstName} ${form.clientLastName}`.trim();

      await updateContract(Number(id), {
        ...form,
        clientName,
        amount: Number(form.amount),
      });

      toast.success('Contrat mis a jour avec succes');
      navigate('/contracts');
    } catch {
      toast.error('Erreur lors de la mise a jour du contrat');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="surface rounded-lg p-7">
        <p className="text-sm font-bold uppercase text-blue-700">
          Edition
        </p>
        <h1 className="mb-6 mt-2 text-3xl font-black tracking-tight text-slate-950">
          Modifier contrat
        </h1>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input required name="title" value={form.title} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="contractNumber" value={form.contractNumber} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="clientCin" value={form.clientCin} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="clientEmail" type="email" value={form.clientEmail} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="clientFirstName" value={form.clientFirstName} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="clientLastName" value={form.clientLastName} onChange={handleChange} className="control rounded-lg p-3" />
          <input name="clientPhone" value={form.clientPhone} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="amount" type="number" value={form.amount} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="startDate" type="date" value={form.startDate} onChange={handleChange} className="control rounded-lg p-3" />
          <input required name="endDate" type="date" value={form.endDate} onChange={handleChange} className="control rounded-lg p-3" />

          <textarea
            name="clientAddress"
            value={form.clientAddress}
            onChange={handleChange}
            className="control rounded-lg p-3 md:col-span-2"
            placeholder="Adresse du client"
          />

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-500">
                Description et conditions
              </p>

              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={17} />
                {isGeneratingDescription ? 'Generation...' : 'Generer avec IA'}
              </button>
            </div>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="control min-h-40 w-full rounded-lg p-3"
              placeholder="Description et conditions"
            />
          </div>

          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
