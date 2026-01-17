// User and Authentication
export interface User {
  id: string;
  email: string;
  role: 'patient' | 'admin';
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface Admin {
  id: string;
  user_id: string;
  created_at: string;
}

// Doctor
export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  profile_photo_url?: string;
  created_at: string;
}

export interface DoctorCreate {
  first_name: string;
  last_name: string;
  specialization: string;
  profile_photo_url?: string;
}

export interface DoctorUpdate {
  first_name?: string;
  last_name?: string;
  specialization?: string;
  profile_photo_url?: string;
}

// Availability Slot
export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface AvailabilitySlotCreate {
  doctor_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

// Appointment
export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id?: string;
  slot_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  doctor?: Doctor;
  slot?: AvailabilitySlot;
}

export interface AppointmentCreate {
  slot_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
}

export interface AppointmentManualCreate extends AppointmentCreate {
  patient_id?: string;
}

// API Responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Auth
export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
  email: string;
}

// Filters and Search
export interface DoctorFilter {
  specialization?: string;
  search?: string;
}

export interface AppointmentFilter {
  doctor_id?: string;
  patient_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}
