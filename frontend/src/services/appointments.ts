import { apiClient } from './api';
import { Appointment } from '@/types';

interface AppointmentCreate {
  slot_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
}

interface AppointmentManualCreate extends AppointmentCreate {
  patient_id?: string;
}

interface AppointmentUpdate {
  patient_first_name?: string;
  patient_last_name?: string;
  patient_phone?: string;
  patient_email?: string;
}

export const appointmentsApi = {

  // Patient: book appointment
  create: async (data: AppointmentCreate): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  },

  // Patient: get their appointments
  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments/me');
    return response.data;
  },

  // Patient/Admin: update appointment data
  update: async (appointmentId: string, data: AppointmentUpdate): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${appointmentId}`, data);
    return response.data;
  },

  // Patient/Admin: cancel appointment
  cancel: async (appointmentId: string): Promise<Appointment> => {
    const response = await apiClient.delete<Appointment>(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Admin: get all appointments
  getAll: async (params?: {
    doctor_id?: string;
    date?: string;
    status?: string;
  }): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/appointments/admin/all', { params });
    return response.data;
  },

  // Admin: manual booking
  createManual: async (data: AppointmentManualCreate): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/appointments/admin/manual', data);
    return response.data;
  },
};