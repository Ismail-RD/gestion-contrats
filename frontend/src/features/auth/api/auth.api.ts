import { api } from '../../../lib/axios';

type LoginResponse = {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
  };
};

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', {
    username: username.trim(),
    password,
  });

  return res.data;
};

export const getProfile = async () => {
  const res = await api.get('/auth/profile');
  return res.data;
};

export const completeInvitation = async (
  token: string,
  username: string,
  password: string,
) => {
  const res = await api.post('/auth/register/invitation', {
    token,
    username: username.trim(),
    password,
  });

  return res.data;
};
