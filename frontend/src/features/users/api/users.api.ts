import { api } from '../../../lib/axios';

export type UserRole = 'ADMIN' | 'USER';

export type User = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type InviteUserData = {
  email: string;
};

export type InviteUserResponse = {
  email: string;
  emailSent: boolean;
  registrationUrl: string;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>('/users');
  return res.data;
};

export const inviteUser = async (
  data: InviteUserData,
): Promise<InviteUserResponse> => {
  const res = await api.post<InviteUserResponse>('/users', data);
  return res.data;
};

export const updateUserRole = async (
  id: number,
  role: UserRole,
): Promise<User> => {
  const res = await api.patch<User>(`/users/${id}/role`, { role });
  return res.data;
};

export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const res = await api.delete<{ message: string }>(`/users/${id}`);
  return res.data;
};
