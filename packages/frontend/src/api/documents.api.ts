import { api, API_URL } from './client';

export const documentsApi = {
  list: async (params: any) => {
    const res = await api.get('/documents', { params });
    return res.data;
  },

  /**
   * Upload a document with real progress tracking.
   * @param formData - FormData containing file, title, docType
   * @param onProgress - callback with 0-100 progress value
   */
  upload: async (formData: FormData, onProgress?: (pct: number) => void) => {
    const res = await api.post('/documents/upload', formData, {
      // Do NOT set Content-Type manually — let axios/browser set the
      // multipart/form-data boundary automatically. Setting it manually
      // breaks the boundary and causes the server to hang waiting for data.
      timeout: 5 * 60 * 1000, // 5 minutes for large files
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
    return res.data;
  },

  getMetadata: async (id: string) => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  getDownloadUrl: (id: string) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/api/v1/documents/${id}/download?token=${token}`;
  },

  getChunks: async (id: string) => {
    const res = await api.get(`/documents/${id}/chunks`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },

  reingest: async (id: string) => {
    const res = await api.post(`/documents/${id}/reingest`);
    return res.data;
  }
};
export default documentsApi;
