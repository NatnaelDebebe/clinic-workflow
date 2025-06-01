
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
import { PATIENTS_UPDATED_EVENT, getManagedPatients } from '@/lib/data/patients';
// import { APPOINTMENTS_UPDATED_EVENT, getManagedAppointments, type Appointment } from '@/lib/data/appointments'; // Removed
// import { isToday, parseISO, isValid } from 'date-fns'; // Removed if only used for appointments

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; username: string; id?: string } | null>(null);
  
  const [labTestsCatalog, setLabTestsCatalog] = useState<AdminLabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  
  const [totalPatientsCount, setTotalPatientsCount] = useState<number | null>(null);
  // const [todaysAppointmentsCount, setTodaysAppointmentsCount] = useState<number | null>(null); // Removed
  // const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]); // Removed

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
    if (typeof window !== 'undefined') { 
        const tests = getManagedLabTests(); 
        setLabTestsCatalog(tests.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const refreshPatientStats = useCallback(() => {
    if (typeof window !== 'undefined') { 
        const patients = getManagedPatients(); 
        setTotalPatientsCount(patients.length);
    }
  }, []);

  // Removed refreshTodaysAppointmentsCount and refreshUpcomingAppointments

  useEffect(() => {
    if (currentUser) {
      refreshPatientStats();
      // refreshTodaysAppointmentsCount(); // Removed
      // refreshUpcomingAppointments(); // Removed

      if (currentUser.role === 'admin' || currentUser.role === 'receptionist') {
        refreshLabTestsView();
      }
    }

    const handleLabTestsUpdate = () => {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'receptionist')) {
        refreshLabTestsView();
      }
    };
    
    const handlePatientsUpdate = () => {
      refreshPatientStats();
    };
    
    // Removed handleAppointmentsUpdate

    if (typeof window !== 'undefined') {
        window.addEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);
        window.addEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
        // window.addEventListener(APPOINTMENTS_UPDATED_EVENT, handleAppointmentsUpdate); // Removed
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);
        window.removeEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
        // window.removeEventListener(APPOINTMENTS_UPDATED_EVENT, handleAppointmentsUpdate); // Removed
      }
    };
  }, [currentUser, refreshLabTestsView, refreshPatientStats]); // Removed appointment refreshers from dependencies

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6"> {/* Adjusted grid cols after removing one card */}
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
        {/* Card for Appointments Today removed */}
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
        {/* Upcoming Appointments Table removed */}

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
