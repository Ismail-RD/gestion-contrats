import { api } from "../../../lib/axios";

export type ContractStatus =
  | 'UNSIGNED'
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED';

export type createContractData ={
    title: string;
    contractNumber: string;
    clientName: string;
    clientCin: string;
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    description?: string;
    startDate: string;
    endDate: string;
    amount: number;
}

export type ContractStats ={
    total: number;
    active: number;
    expired: number;
    draft: number;
    terminated: number;
    unsigned: number;
};

export type Contract = {
  id: number;
  title: string;
  contractNumber: string;
  clientName: string;
  clientCin?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  startDate: string;
  endDate: string;
  amount: string | number;
  status: ContractStatus;
  signatureUrl?: string;
  emailSent?: boolean;
  signedAt?: string | null;
  signerName?: string | null;
  signatureDataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
  };
};

export const getExpiringSoonContracts = async (): Promise<Contract[]> => {
  const res = await api.get<Contract[]>('/contracts/expiring-soon');
  return res.data;
};

export const getContractStats = async () : Promise<ContractStats> => {
    const res = await api.get("/contracts/stats/summary");
    return res.data;
}

export const getContracts = async () => {
    const res = await api.get("/contracts");
    return res.data;
};

export const createContract = async (data: createContractData)=>{
    const res = await api.post("/contracts",data);
    return res.data;
}

export const deleteContract = async (id : number)=>{
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
}

type UpdateContractData = Partial<createContractData> & {
    status?: ContractStatus;
};

export const updateContract = async (id : number, data: UpdateContractData)=>{
    const res= await api.patch(`/contracts/${id}`,data);
    return res.data;
}

export const terminateContract = async (id: number): Promise<Contract> => {
    const res = await api.patch(`/contracts/${id}`, {
        status: 'TERMINATED',
    });
    return res.data;
}

export const getContractById = async (id : number)=>{
    const res = await api.get(`contracts/${id}`);
    return res.data;
}

export const resendSignatureEmail = async (id: number): Promise<Contract> => {
    const res = await api.post(`/contracts/${id}/send-signature-email`);
    return res.data;
}

export const getContractForSignature = async (token: string): Promise<Contract> => {
    const res = await api.get(`/contracts/signature/${token}`);
    return res.data;
}

export const confirmContractSignature = async (
    token: string,
    data: { signerName: string; signatureDataUrl?: string },
): Promise<Contract> => {
    const res = await api.post(`/contracts/signature/${token}/confirm`, data);
    return res.data;
}

export const downloadContractPdf = async (id: number): Promise<Blob> => {
    const res = await api.get(`/contracts/${id}/pdf`, {
        responseType: 'blob',
    });
    return res.data;
}
