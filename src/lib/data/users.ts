
// src/lib/data/users.ts

export type UserRole = 'admin' | 'doctor' | 'lab_tech' | 'receptionist' | 'patient';

export const userRoles: UserRole[] = ['admin', 'doctor', 'lab_tech', 'receptionist', 'patient'];

export interface User {
  id: string;
  fullName: string;
  username: string; // This will be used as email for login
  password?: string; // Password will be checked directly for this demo
  role: UserRole;
  status: 'Active' | 'Inactive';
}

// Sample user data, including a default admin with a known password
export const initialUsers: User[] = [
  { id: 'admin001', fullName: 'Admin User', username: 'admin@clinic.com', password: 'adminpassword', role: 'admin', status: 'Active' },
  { id: 'doc001', fullName: 'Dr. Amelia Harper', username: 'amelia.harper@clinic.com', password: 'doctorpassword', role: 'doctor', status: 'Active' },
  { id: 'lab001', fullName: 'Mark Johnson', username: 'mark.johnson@clinic.com', password: 'labpassword', role: 'lab_tech', status: 'Active' },
  { id: 'rec001', fullName: 'Sarah Miller', username: 'sarah.miller@clinic.com', password: 'receptionistpassword', role: 'receptionist', status: 'Active' },
  { id: 'pat001', fullName: 'John Doe', username: 'john.patient@example.com', password: 'patientpassword', role: 'patient', status: 'Active' },
  { id: 'doc002', fullName: 'Dr. Robert Harris', username: 'robert.harris@clinic.com', password: 'doctorpassword2', role: 'doctor', status: 'Inactive'},
  { id: 'user007', fullName: 'Liam Harper', username: 'liam.harper@example.com', password: 'password123', role: 'patient', status: 'Active' },
  { id: 'user008', fullName: 'Olivia Bennett', username: 'olivia.bennett@example.com', password: 'password123', role: 'patient', status: 'Active' },
  { id: 'user009', fullName: 'Noah Foster', username: 'noah.foster@example.com', password: 'password123', role: 'patient', status: 'Inactive' },
  { id: 'user010', fullName: 'Ava Mitchell', username: 'ava.mitchell@example.com', password: 'password123', role: 'patient', status: 'Active' },
];

const MANAGED_USERS_STORAGE_KEY = 'managedUsers';

export function getManagedUsers(): User[] {
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(MANAGED_USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch (e) {
        console.error("Error parsing managed users from localStorage", e);
        // Fallback to initialUsers if parsing fails
        localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(initialUsers));
        return initialUsers;
      }
    } else {
      localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
  }
  return initialUsers; // Fallback for SSR or environments without localStorage
}

export function saveManagedUsers(users: User[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(users));
  }
}
