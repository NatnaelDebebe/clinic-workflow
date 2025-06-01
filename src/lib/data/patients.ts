
// src/lib/data/patients.ts

export type Gender = 'Male' | 'Female' | 'Other';

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  notes: string;
  enteredBy?: string; // Doctor's name or ID
}

export interface Prescription {
  id: string;
  datePrescribed: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy?: string; // Doctor's name or ID
}

export interface PatientLabRequest {
  id: string; // Unique ID for this specific request instance
  testId: string; // ID of the test from availableLabTests
  testName: string;
  requestedDate: string;
  status: 'Pending Payment' | 'Pending' | 'Completed' | 'Cancelled'; // Added 'Pending Payment'
  resultsSummary?: string; // Textual summary of the lab results
  resultEnteredBy?: string; // Name of the lab tech who entered the results
  resultDate?: string; // Date when results were entered
  requestedBy?: string; // Doctor's name or ID
  priceAtTimeOfRequest?: number; // Price at the time of request
  patientName?: string; // Added for easier display in billing/lab request views
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: Gender;
  address: string;
  phoneNumber: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'Active' | 'Inactive';
  lastVisit?: string;
  registrationDate: string;
  medicalHistory: MedicalHistoryEntry[];
  prescriptions: Prescription[];
  labRequests: PatientLabRequest[];
}

export const initialPatients: Patient[] = [
  { id: 'pat001', name: 'Liam Harper', dob: '1985-03-15', gender: 'Male', address: '123 Main St, Anytown, USA', phoneNumber: '555-0101', email: 'liam.harper@example.com', emergencyContactName: 'Sophie Harper', emergencyContactPhone: '555-0102', lastVisit: '2023-11-20', status: 'Active', registrationDate: '2023-01-10', medicalHistory: [], prescriptions: [], labRequests: [] },
  { id: 'pat002', name: 'Olivia Bennett', dob: '1992-07-22', gender: 'Female', address: '456 Oak Ave, Anytown, USA', phoneNumber: '555-0103', email: 'olivia.bennett@example.com', lastVisit: '2023-12-05', status: 'Active', registrationDate: '2023-02-15', medicalHistory: [], prescriptions: [], labRequests: [] },
  { id: 'pat003', name: 'Noah Foster', dob: '1978-11-10', gender: 'Male', address: '789 Pine Rd, Anytown, USA', phoneNumber: '555-0104', status: 'Inactive', lastVisit: '2023-10-15', registrationDate: '2023-03-20', medicalHistory: [], prescriptions: [], labRequests: [] },
  { id: 'pat004', name: 'Ava Mitchell', dob: '1989-05-08', gender: 'Female', address: '101 Maple Dr, Anytown, USA', phoneNumber: '555-0105', email: 'ava.mitchell@example.com', lastVisit: '2023-11-28', status: 'Active', registrationDate: '2023-04-25', medicalHistory: [], prescriptions: [], labRequests: [] },
  { id: 'pat005', name: 'Ethan Hayes', dob: '1995-09-18', gender: 'Male', address: '202 Birch Ln, Anytown, USA', phoneNumber: '555-0106', status: 'Active', lastVisit: '2023-12-10', registrationDate: '2023-05-30', medicalHistory: [], prescriptions: [], labRequests: [] },
];

const MANAGED_PATIENTS_STORAGE_KEY = 'managedPatients';
export const PATIENTS_UPDATED_EVENT = 'patientsUpdated'; // Export event name

export function getManagedPatients(): Patient[] {
  if (typeof window !== 'undefined') {
    const storedPatients = localStorage.getItem(MANAGED_PATIENTS_STORAGE_KEY);
    if (storedPatients) {
      try {
        const parsedPatients = JSON.parse(storedPatients) as Patient[];
        // Ensure new fields have default empty arrays or undefined if missing from older localStorage data
        return parsedPatients.map(p => ({
          ...p,
          medicalHistory: p.medicalHistory || [],
          prescriptions: p.prescriptions || [],
          labRequests: (p.labRequests || []).map(req => ({
            ...req,
            resultsSummary: req.resultsSummary || undefined,
            resultEnteredBy: req.resultEnteredBy || undefined,
            resultDate: req.resultDate || undefined,
          })),
        }));
      } catch (e) {
        console.error("Error parsing managed patients from localStorage", e);
        // Initialize with new fields if parsing fails
        const initializedPatients = initialPatients.map(p => ({
          ...p,
          medicalHistory: [],
          prescriptions: [],
          labRequests: [], // New requests will get the new fields by default when created
        }));
        localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(initializedPatients));
        return initializedPatients;
      }
    } else {
       const initializedPatients = initialPatients.map(p => ({
          ...p,
          medicalHistory: [],
          prescriptions: [],
          labRequests: [],
        }));
      localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(initializedPatients));
      return initializedPatients;
    }
  }
  // Fallback for SSR or environments without localStorage, ensuring new fields
  return initialPatients.map(p => ({
    ...p,
    medicalHistory: p.medicalHistory || [],
    prescriptions: p.prescriptions || [],
    labRequests: (p.labRequests || []).map(req => ({
        ...req,
        resultsSummary: req.resultsSummary || undefined,
        resultEnteredBy: req.resultEnteredBy || undefined,
        resultDate: req.resultDate || undefined,
    })),
  }));
}

export function saveManagedPatients(patients: Patient[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANAGED_PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    window.dispatchEvent(new CustomEvent(PATIENTS_UPDATED_EVENT)); // Dispatch event
  }
}
