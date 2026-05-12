import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

// ajouter token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue',
) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || error.response?.data?.error || fallback;
}
