// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // keep if your backend uses cookies; ok to remove otherwise
  timeout: 30_000,
});

// Central response unwrap helper — many endpoints return { success, message, data }
export function unwrap<T = any>(res: AxiosResponse<any>): T {
  if (!res) return (null as unknown) as T;
  // prefer res.data.data when present, otherwise return res.data
  if (res.data && (res.data.data !== undefined && res.data.data !== null)) {
    return res.data.data as T;
  }
  return res.data as T;
}

// Optional: response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize axios error object to make it easier in components
    const normalized: any = {
      message: error?.message || 'Network error',
      status: error?.response?.status,
      data: error?.response?.data,
    };
    return Promise.reject(normalized);
  }
);

// Convenience exported endpoint helpers
export const health = () => api.get('/health');
export const getDashboard = (params?: Record<string, any>) => api.get('/dashboard', { params });
export const getInventory = (dataset: string, params?: Record<string, any>) =>
  api.get(`/inventory/${dataset}`, { params });
export const getInventoryDrugs = (params?: Record<string, any>) => api.get('/inventory/drugs', { params });
export const uploadCSV = (formData: FormData) =>
  api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const chat = (payload: { message: string; session_id?: string }) => api.post('/chat', payload);
export const getAlerts = (params?: Record<string, any>) => api.get('/alerts', { params });

export default api;
