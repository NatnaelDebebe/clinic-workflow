// src/lib/data/patients.ts

export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: Gender;
  address: string;
  phoneNumber: string;
  email?: string; // Optional
  emergencyContactName?: string; // Optional
  emergencyContactPhone?: string; // Optional
  status: 'Active' | 'Inactive';
  lastVisit?: string; // Optional, can be updated later
  registrationDate: string; // Should be set on creation
}

export const initialPatients: Patient[] = [
  { id: 'pat001', name: 'Liam Harper', dob: '1985-03-15', gender: 'Male', address: '123 Main St, Anytown, USA', phoneNumber: '555-0101', email: 'liam.harper@example.com', emergencyContactName: 'Sophie Harper', emergencyContactPhone: '555-0102', lastVisit: '2023-11-20', status: 'Active', registrationDate: '2023-01-10' },
  { id: 'pat002', name: 'Olivia Bennett', dob: '1992-07-22', gender: 'Female', address: '456 Oak Ave, Anytown, USA', phoneNumber: '555-0103', email: 'olivia.bennett@example.com', lastVisit: '2023-12-05', status: 'Active', registrationDate: '2023-02-15' },
  { id: 'pat003', name: 'Noah Foster', dob: '1978-11-10', gender: 'Male', address: '789 Pine Rd, Anytown, USA', phoneNumber: '555-0104', status: 'Inactive', lastVisit: '2023-10-15', registrationDate: '2023-03-20' },
  { id: 'pat004', name: 'Ava Mitchell', dob: '1989-05-08', gender: 'Female', address: '101 Maple Dr, Anytown, USA', phoneNumber: '555-0105', email: 'ava.mitchell@example.com', lastVisit: '2023-11-28', status: 'Active', registrationDate: '2023-04-25' },
  { id: 'pat005', name: 'Ethan Hayes', dob: '1995-09-18', gender: 'Male', address: '202 Birch Ln, Anytown, USA', phoneNumber: '555-0106', status: 'Active', lastVisit: '2023-12-10', registrationDate: '2023-05-30' },
];

const MANAGED_PATIENTS_STORAGE_KEY = 'managedPatients';

export function getManagedPatients(): Patient[] {
  if (typeof window !== 'undefined') {
    const storedPatients = localStorage.getItem(MANAGED_PATIENTS_STORAGE_KEY);
    if (storedPatients) {
      try {
        return JSON.parse(storedPatients);
      } catch (e) {
        console.error("Error parsing managed patients from localStorage", e);
        localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(initialPatients));
        return initialPatients;
      }
    } else {
      localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(initialPatients));
      return initialPatients;
    }
  }
  return initialPatients; // Fallback for SSR or environments without localStorage
}

export function saveManagedPatients(patients: Patient[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(patients));
  }
}
