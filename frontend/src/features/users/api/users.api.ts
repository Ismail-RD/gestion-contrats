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

export type CreateUserData = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<User[]>('/users');
  return res.data;
};

export const createUser = async (data: CreateUserData): Promise<User> => {
  const res = await api.post<User>('/users', data);
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