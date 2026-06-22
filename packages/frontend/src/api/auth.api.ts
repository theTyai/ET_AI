import { api } from './client';

export const authApi = {
  register: async (payload: any) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  listPlants: async () => {
    const res = await api.get('/auth/plants');
    return res.data;
  },

  login: async (payload: any) => {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refreshToken });
    return res.data;
  }
};
