
'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Users, FlaskConical, FileText, Link as LinkIcon } from 'lucide-react';
import type { UserRole } from '@/lib/data/users';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { LAB_TESTS_UPDATED_EVENT, type AdminLabTest, getManagedLabTests } from '@/lib/data/labTests';
import { PATIENTS_UPDATED_EVENT, getManagedPatients, type PatientLabRequest } from '@/lib/data/patients';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; username: string; id?: string } | null>(null);
  
  const [labTestsCatalog, setLabTestsCatalog] = useState<AdminLabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  
  const [totalPatientsCount, setTotalPatientsCount] = useState<number | null>(null);

  // Doctor specific stats
  const [doctorPendingLabRequestsCount, setDoctorPendingLabRequestsCount] = useState<number>(0);
  const [doctorCompletedLabRequestsCount, setDoctorCompletedLabRequestsCount] = useState<number>(0);

  // Lab Tech specific stats
  const [labTechTotalRequestsCount, setLabTechTotalRequestsCount] = useState<number>(0);
  const [labTechPendingProcessingCount, setLabTechPendingProcessingCount] = useState<number>(0);


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

  const refreshDashboardStats = useCallback(() => {
    if (typeof window === 'undefined' || !currentUser) return;

    const patients = getManagedPatients();
    setTotalPatientsCount(patients.length);

    if (currentUser.role === 'doctor') {
      let pendingCount = 0;
      let completedCount = 0;
      patients.forEach(patient => {
        patient.labRequests.forEach(req => {
          if (req.requestedBy === currentUser.fullName) {
            if (req.status === 'Pending Payment' || req.status === 'Pending') {
              pendingCount++;
            } else if (req.status === 'Completed') {
              completedCount++;
            }
          }
        });
      });
      setDoctorPendingLabRequestsCount(pendingCount);
      setDoctorCompletedLabRequestsCount(completedCount);
    }

    if (currentUser.role === 'lab_tech') {
      let totalCount = 0;
      let pendingProcessing = 0;
      patients.forEach(patient => {
        totalCount += patient.labRequests.length;
        patient.labRequests.forEach(req => {
          if (req.status === 'Pending') {
            pendingProcessing++;
          }
        });
      });
      setLabTechTotalRequestsCount(totalCount);
      setLabTechPendingProcessingCount(pendingProcessing);
    }

    if (currentUser.role === 'admin' || currentUser.role === 'receptionist') {
      const tests = getManagedLabTests();
      setLabTestsCatalog(tests.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [currentUser]);


  useEffect(() => {
    if (currentUser) {
      refreshDashboardStats();
    }

    const handlePatientsUpdate = () => {
      if (currentUser) refreshDashboardStats();
    };
    const handleLabTestsUpdate = () => {
       if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'receptionist')) {
         const tests = getManagedLabTests(); 
         setLabTestsCatalog(tests.sort((a, b) => a.name.localeCompare(b.name)));
       }
    };
    
    if (typeof window !== 'undefined') {
        window.addEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
        window.addEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
        window.removeEventListener(LAB_TESTS_UPDATED_EVENT, handleLabTestsUpdate);
      }
    };
  }, [currentUser, refreshDashboardStats]);

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

  if (!currentUser) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  // Admin and Receptionist Dashboard
  if (currentUser.role === 'admin' || currentUser.role === 'receptionist') {
    return (
      <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground text-sm">{welcomeMessage}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalPatientsCount !== null ? totalPatientsCount : 'Loading...'}
              </div>
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
      </div>
    );
  }

  // Doctor Dashboard
  if (currentUser.role === 'doctor') {
    return (
      <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Doctor Dashboard</h1>
            <p className="text-muted-foreground text-sm">{welcomeMessage}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Your Pending Lab Requests</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{doctorPendingLabRequestsCount}</div>
              <p className="text-xs text-muted-foreground">
                Lab tests you requested that are pending payment or processing.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Your Completed Lab Results</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{doctorCompletedLabRequestsCount}</div>
              <p className="text-xs text-muted-foreground">
                Lab tests you requested that have been completed.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                    <Link href="/admin/patients">
                        <Users className="mr-3 h-5 w-5" />
                        <div>
                            <p className="font-medium text-foreground">View All Patients</p>
                            <p className="text-sm text-muted-foreground">Access and manage patient records.</p>
                        </div>
                    </Link>
                </Button>
                 <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                    <Link href="/admin/lab-requests">
                        <FlaskConical className="mr-3 h-5 w-5" />
                         <div>
                            <p className="font-medium text-foreground">View Lab Requests</p>
                            <p className="text-sm text-muted-foreground">Track status of all lab test requests.</p>
                        </div>
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    );
  }

  // Lab Technician Dashboard
  if (currentUser.role === 'lab_tech') {
     return (
      <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Lab Technician Dashboard</h1>
            <p className="text-muted-foreground text-sm">{welcomeMessage}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Lab Requests</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{labTechTotalRequestsCount}</div>
              <p className="text-xs text-muted-foreground">Overall lab requests in the system.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending Processing</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{labTechPendingProcessingCount}</div>
              <p className="text-xs text-muted-foreground">Lab tests awaiting processing.</p>
            </CardContent>
          </Card>
        </div>
         <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Links</h2>
            <Button variant="outline" asChild className="justify-start text-left h-auto py-3 w-full sm:max-w-xs">
                <Link href="/admin/lab-requests">
                    <FlaskConical className="mr-3 h-5 w-5" />
                    <div>
                        <p className="font-medium text-foreground">Manage Lab Requests</p>
                        <p className="text-sm text-muted-foreground">View and update lab test statuses.</p>
                    </div>
                </Link>
            </Button>
        </div>
      </div>
    );
  }

  // Fallback for any other roles or if currentUser.role is somehow not covered
  return (
     <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground text-sm">{welcomeMessage}</p>
          </div>
        </div>
        <p className="text-muted-foreground">Dashboard view for your role is under construction.</p>
     </div>
  );
}

