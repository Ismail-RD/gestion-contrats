import { Check, Eraser } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

import {
  confirmContractSignature,
  getContractForSignature,
  type Contract,
} from '../api/contracts.api';

export default function SignaturePage() {
  const { token } = useParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const [contract, setContract] = useState<Contract | null>(null);
  const [signerName, setSignerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    if (!token) return;

    getContractForSignature(token).then((data) => {
      setContract(data);
      setSignerName(data.clientName);
      setIsSigned(Boolean(data.signedAt));
    });
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(scale, scale);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#111827';
  }, [contract]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getPoint(event);
    isDrawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const context = event.currentTarget.getContext('2d');
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !signerName.trim()) return;

    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current?.toDataURL('image/png');

      const signedContract = await confirmContractSignature(token, {
        signerName: signerName.trim(),
        signatureDataUrl,
      });

      setContract(signedContract);
      setIsSigned(true);
      toast.success('Contrat signe avec succes');
    } catch {
      toast.error('Signature impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contract) {
    return (
      <main className="app-shell min-h-screen p-6">
        <div className="surface mx-auto max-w-3xl rounded-lg p-8">
          <p className="text-slate-500">Chargement du contrat...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen p-6">
      <div className="surface mx-auto max-w-3xl rounded-lg p-8">
        <div className="mb-6 border-b border-gray-200 pb-5">
          <p className="text-sm font-medium text-blue-700">
            Signature electronique
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {contract.title}
          </h1>
          <p className="mt-2 text-gray-500">
            Contrat #{contract.contractNumber} pour {contract.clientName}
          </p>
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-gray-500">CIN</p>
            <p className="font-medium text-gray-900">
              {contract.clientCin || '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">
              {contract.clientEmail || '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Periode</p>
            <p className="font-medium text-gray-900">
              {contract.startDate.slice(0, 10)} au {contract.endDate.slice(0, 10)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Montant</p>
            <p className="font-medium text-gray-900">
              {Number(contract.amount).toLocaleString('fr-MA')} MAD
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-gray-700">
          {contract.description || 'Aucune description'}
        </div>

        {isSigned ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-green-800">
            Contrat signe. Son statut est maintenant {contract.status}.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              required
              value={signerName}
              onChange={(event) => setSignerName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nom complet du signataire"
            />

            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="h-48 w-full touch-none rounded-xl border border-gray-300 bg-white"
            />

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={clearSignature}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-gray-700 transition hover:bg-gray-100"
              >
                <Eraser size={18} />
                Effacer
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={18} />
                Confirmer la signature
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
