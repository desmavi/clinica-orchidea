import { apiClient } from './api';
import { AvailabilitySlot } from '@/types';

interface CreateSlotsRequest {
  doctor_id: string;
  date: string;      // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
}

interface CreateSlotsResponse {
  message: string;
  slots_created: number;
  slots: AvailabilitySlot[];
}

export const availabilityApi = {
  // Get slots for a doctor
  getByDoctor: async (
    doctorId: string,
    date?: string,
    availableOnly: boolean = true
  ): Promise<AvailabilitySlot[]> => {
    const params: Record<string, string | boolean> = { available_only: availableOnly };
    if (date) params.date = date;

    const response = await apiClient.get<AvailabilitySlot[]>(
      `/doctors/${doctorId}/slots`,
      { params }
    );
    return response.data;
  },

  // Get dates that have available slots
  getAvailableDates: async (doctorId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      `/doctors/${doctorId}/available-dates`
    );
    return response.data;
  },

  // Create slots (admin only)
  createSlots: async (data: CreateSlotsRequest): Promise<CreateSlotsResponse> => {
    const response = await apiClient.post<CreateSlotsResponse>(
      '/admin/availability',
      data
    );
    return response.data;
  },

  // Toggle slot availability (admin only)
  toggleAvailability: async (
    slotId: string,
    isAvailable: boolean
  ): Promise<AvailabilitySlot> => {
    const response = await apiClient.patch<AvailabilitySlot>(
      `/admin/availability/${slotId}`,
      null,
      { params: { is_available: isAvailable } }
    );
    return response.data;
  },

  // Delete slot (admin only)
  deleteSlot: async (slotId: string): Promise<void> => {
    await apiClient.delete(`/admin/availability/${slotId}`);
  },
};