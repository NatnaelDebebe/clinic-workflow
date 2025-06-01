
'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import type { UserRole } from '@/lib/data/users';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LAB_TESTS_UPDATED_EVENT, type AdminLabTest, getManagedLabTests } from '@/lib/data/labTests';
import { PATIENTS_UPDATED_EVENT, getManagedPatients } from '@/lib/data/patients'; // Import patient data functions

// Sample data for upcoming appointments (can be made dynamic later)
const upcomingAppointments = [
  { id: '1', patientName: 'Ethan Carter', date: '2024-07-20', time: '10:00 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '2', patientName: 'Olivia Bennett', date: '2024-07-20', time: '11:30 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '3', patientName: 'Noah Thompson', date: '2024-07-20', time: '02:00 PM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '4', patientName: 'Sophia Evans', date: '2024-07-21', time: '09:00 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: '5', patientName: 'Liam Foster', date: '2024-07-21', time: '10:30 AM', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; username: string } | null>(null);
  
  const [labTestsCatalog, setLabTestsCatalog] = useState<AdminLabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  
  const [totalPatientsCount, setTotalPatientsCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData);
        } catch (e) {
          console.error("Error parsing current user from localStorage on dashboard", e);
          toast({ variant: "destructive", title: "Authentication Error", description: "Please log in again." });
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  }, [router, toast]);

  const refreshLabTestsView = useCallback(() => {
    const tests = getManagedLabTests();
    setLabTestsCatalog(tests.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const refreshPatientStats = useCallback(() => {
    const patients = getManagedPatients();
    setTotalPatientsCount(patients.length);
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Initial load for patient stats
      refreshPatientStats();

      // Initial load for lab tests if user is admin or receptionist
      if (currentUser.role === 'admin' || currentUser.role === 'receptionist') {
        refreshLabTestsView();
      }
    }

    // Listen for lab tests updates
    const handleLabTestsUpdate = () => {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'receptionist')) {
        refreshLabTestsView();
      }
    };
    window.addEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);

    // Listen for patient updates
    const handlePatientsUpdate = () => {
      refreshPatientStats();
    };
    window.addEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    
    return () => {
      window.removeEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);
      window.removeEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    };
  }, [currentUser, refreshLabTestsView, refreshPatientStats]);

  const handleLabTestSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLabTestSearchTerm(event.target.value.toLowerCase());
  };

  const filteredLabTestsCatalog = useMemo(() => {
    if (!labTestSearchTerm) return labTestsCatalog;
    return labTestsCatalog.filter(test =>
      test.name.toLowerCase().includes(labTestSearchTerm)
    );
  }, [labTestsCatalog, labTestSearchTerm]);
  
  const welcomeMessage = currentUser ? `Welcome back, ${currentUser.fullName}` : 'Loading user information...';
  const showLabTestCatalog = currentUser && (currentUser.role === 'admin' || currentUser.role === 'receptionist');


  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{welcomeMessage}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalPatientsCount !== null ? totalPatientsCount : 'Loading...'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">15</div> {/* Static for now */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenue This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$12,500</div> {/* Static for now */}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1"> {/* Main content area */}
        <Card>
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-bold font-headline">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-foreground font-medium">Patient Name</TableHead>
                    <TableHead className="text-foreground font-medium">Date</TableHead>
                    <TableHead className="text-foreground font-medium">Time</TableHead>
                    <TableHead className="text-foreground font-medium">Doctor</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {upcomingAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                        <TableCell className="font-medium text-foreground">{appointment.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">{appointment.date}</TableCell>
                        <TableCell className="text-muted-foreground">{appointment.time}</TableCell>
                        <TableCell className="text-muted-foreground">{appointment.doctor}</TableCell>
                        <TableCell>
                        <Badge variant="secondary">{appointment.status}</Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
                {upcomingAppointments.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No upcoming appointments.
                    </div>
                )}
            </CardContent>
        </Card>

        {showLabTestCatalog && (
           <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-headline">Available Lab Tests &amp; Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search lab tests by name..."
                    className="pl-10 h-10 rounded-md border-input bg-background placeholder:text-muted-foreground"
                    value={labTestSearchTerm}
                    onChange={handleLabTestSearchChange}
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground font-medium">Test Name</TableHead>
                      <TableHead className="text-foreground font-medium text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabTestsCatalog.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium text-foreground">{test.name}</TableCell>
                        <TableCell className="text-muted-foreground text-right">${test.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredLabTestsCatalog.length === 0 && labTestsCatalog.length > 0 && (
                     <div className="text-center py-10 text-muted-foreground">
                        No lab tests found matching your search.
                     </div>
                )}
                {labTestsCatalog.length === 0 && (
                     <div className="text-center py-10 text-muted-foreground">
                        No lab tests found in the catalog.
                        {currentUser?.role === 'admin' && <p className="text-sm">Go to "Manage Lab Tests" to add new tests.</p>}
                     </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
