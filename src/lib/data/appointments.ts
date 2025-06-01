
// src/lib/data/appointments.ts
'use client';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for easier display
  doctorId: string;
  doctorName: string; // Denormalized
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM (usually 24hr format from input type=time)
  status: 'Scheduled' | 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string; // ISO string for when the appointment was created
}

export const initialAppointments: Appointment[] = [];

const MANAGED_APPOINTMENTS_STORAGE_KEY = 'managedAppointments';
export const APPOINTMENTS_UPDATED_EVENT = 'appointmentsUpdated';

export function getManagedAppointments(): Appointment[] {
  if (typeof window !== 'undefined') {
    const storedAppointments = localStorage.getItem(MANAGED_APPOINTMENTS_STORAGE_KEY);
    if (storedAppointments) {
      try {
        return JSON.parse(storedAppointments) as Appointment[];
      } catch (e) {
        console.error("Error parsing managed appointments from localStorage", e);
        localStorage.setItem(MANAGED_APPOINTMENTS_STORAGE_KEY, JSON.stringify(initialAppointments));
        return [...initialAppointments];
      }
    } else {
      localStorage.setItem(MANAGED_APPOINTMENTS_STORAGE_KEY, JSON.stringify(initialAppointments));
      return [...initialAppointments];
    }
  }
  return [...initialAppointments]; // Fallback for SSR, return a copy
}

export function saveManagedAppointments(appointments: Appointment[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANAGED_APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    window.dispatchEvent(new CustomEvent(APPOINTMENTS_UPDATED_EVENT));
  }
}
