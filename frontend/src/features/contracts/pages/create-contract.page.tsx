import { useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { createContract } from '../api/contracts.api';

export default function CreateContractPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    contractNumber: '',
    clientCin: '',
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    description: '',
    startDate: '',
    endDate: '',
    amount: '',
  });

  const [error, setError] = useState('');

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const clientName =
        `${form.clientFirstName} ${form.clientLastName}`.trim();

      const contract = await createContract({
        ...form,
        clientName,
        amount: Number(form.amount),
      });

      toast.success(
        contract.emailSent
          ? 'Contrat cree et email envoye au client'
          : 'Contrat cree. Lien de signature prepare.',
      );

      if (contract.signatureUrl) {
        try {
          await navigator.clipboard?.writeText(contract.signatureUrl);
          toast.success('Lien de signature copie dans le presse-papiers');
        } catch {
          console.info('Lien de signature:', contract.signatureUrl);
        }
      }

      navigate('/contracts');
    } catch {
      toast.error('Erreur lors de la creation du contrat');
      setError('Erreur lors de la creation du contrat');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="surface rounded-lg p-7">
        <p className="text-sm font-bold uppercase text-teal-700">
          Nouveau dossier
        </p>
        <h1 className="mb-6 mt-2 text-3xl font-black tracking-tight text-slate-950">
          Nouveau contrat
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            required
            name="title"
            placeholder="Titre du contrat"
            value={form.title}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="contractNumber"
            placeholder="Numero du contrat"
            value={form.contractNumber}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="clientCin"
            placeholder="CIN"
            value={form.clientCin}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="clientEmail"
            type="email"
            placeholder="Email du client"
            value={form.clientEmail}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="clientFirstName"
            placeholder="Prenom"
            value={form.clientFirstName}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="clientLastName"
            placeholder="Nom"
            value={form.clientLastName}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            name="clientPhone"
            placeholder="Telephone"
            value={form.clientPhone}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="amount"
            type="number"
            placeholder="Montant"
            value={form.amount}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <input
            required
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            className="control rounded-lg p-3"
          />

          <textarea
            name="clientAddress"
            placeholder="Adresse du client"
            value={form.clientAddress}
            onChange={handleChange}
            className="control rounded-lg p-3 md:col-span-2"
          />

          <textarea
            name="description"
            placeholder="Description et conditions"
            value={form.description}
            onChange={handleChange}
            className="control rounded-lg p-3 md:col-span-2"
          />

          <div className="flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-slate-950 px-5 py-3 font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Creer et envoyer la signature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
