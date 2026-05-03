import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { getContractById, updateContract } from '../api/contracts.api';

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
        <p className="text-sm font-bold uppercase text-teal-700">
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

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="control rounded-lg p-3 md:col-span-2"
            placeholder="Description et conditions"
          />

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
              className="cursor-pointer rounded-lg bg-slate-950 px-4 py-2 font-bold text-white transition hover:bg-slate-800"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
