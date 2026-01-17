import { apiClient } from './api';
import { Doctor, DoctorCreate, DoctorUpdate } from '@/types';

export const doctorsApi = {
  // Get all doctors, optionally filtered by specialization
  getAll: async (specialization?: string): Promise<Doctor[]> => {
    const params = specialization ? { specialization } : {};
    const response = await apiClient.get<Doctor[]>('/doctors', { params });
    return response.data;
  },

  // Get a single doctor by ID
  getById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get<Doctor>(`/doctors/${id}`);
    return response.data;
  },

  // Get all unique specializations
  getSpecializations: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/doctors/specializations');
    return response.data;
  },

  // Create a new doctor (admin only)
  create: async (data: DoctorCreate): Promise<Doctor> => {
    const response = await apiClient.post<Doctor>('/doctors', data);
    return response.data;
  },

  // Update a doctor (admin only)
  update: async (id: string, data: DoctorUpdate): Promise<Doctor> => {
    const response = await apiClient.put<Doctor>(`/doctors/${id}`, data);
    return response.data;
  },

  // Delete a doctor (admin only)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/doctors/${id}`);
  },
};
