
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from '@/components/ui/card';
import { getManagedPatients, saveManagedPatients, type Patient, type PatientLabRequest, PATIENTS_UPDATED_EVENT } from '@/lib/data/patients';
import type { UserRole } from '@/lib/data/users';
import { userRoles as validUserRoles } from '@/lib/data/users';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface LabRequestWithPatientInfo extends PatientLabRequest {
  patientId: string;
  // patientName is already part of PatientLabRequest
}

export default function AdminBillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; id: string; } | null>(null);
  const [allLabRequests, setAllLabRequests] = useState<LabRequestWithPatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (!storedUser) {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please log in." });
        router.push('/');
        return;
      }
      try {
        const userData = JSON.parse(storedUser) as { fullName: string; role: UserRole; id: string; };
        if (!userData || !userData.id || !validUserRoles.includes(userData.role)) {
          toast({ variant: "destructive", title: "Authentication Error", description: "Invalid user data." });
          localStorage.removeItem('loggedInUser');
          router.push('/');
          return;
        }
        if (userData.role !== 'receptionist' && userData.role !== 'admin') {
          toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
          router.push('/admin');
          return;
        }
        setCurrentUser(userData);
      } catch (e) { 
        console.error("Error parsing current user", e); 
        localStorage.removeItem('loggedInUser');
        router.push('/'); 
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const loadBillingLabRequests = useCallback(() => {
    if(!currentUser || !currentUser.id) return; // Ensure currentUser is set

    const patients = getManagedPatients();
    const requests: LabRequestWithPatientInfo[] = [];
    patients.forEach(patient => {
      patient.labRequests.forEach(req => {
        if (req.status === 'Pending Payment') {
          requests.push({
            ...req,
            patientId: patient.id,
            // patientName is already in req from getManagedPatients data hydration
          });
        }
      });
    });
    setAllLabRequests(requests.sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()));
  }, [currentUser]);

  useEffect(() => {
    if(currentUser) { // Load requests once currentUser is set
      loadBillingLabRequests();
    }
    const handlePatientsUpdate = () => {
      if(currentUser) loadBillingLabRequests();
    };
    window.addEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    return () => {
      window.removeEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    };
  }, [currentUser, loadBillingLabRequests]);
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return allLabRequests;
    return allLabRequests.filter(req =>
      (req.patientName && req.patientName.toLowerCase().includes(searchTerm)) ||
      req.testName.toLowerCase().includes(searchTerm)
    );
  }, [allLabRequests, searchTerm]);

  const handleConfirmPayment = (patientId: string, requestId: string) => {
    const patients = getManagedPatients();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex === -1) {
      toast({ variant: "destructive", title: "Error", description: "Patient not found." });
      return;
    }

    const patient = patients[patientIndex];
    const requestIndex = patient.labRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
      toast({ variant: "destructive", title: "Error", description: "Lab request not found." });
      return;
    }

    patient.labRequests[requestIndex].status = 'Pending';
    patients[patientIndex] = patient;
    saveManagedPatients(patients); // This will trigger the PATIENTS_UPDATED_EVENT
    toast({ title: "Payment Confirmed", description: `Lab request for ${patient.labRequests[requestIndex].testName} marked as pending processing.` });
    // No need to call loadBillingLabRequests directly, event listener will handle it.
  };

  if (!currentUser || (currentUser.role !== 'receptionist' && currentUser.role !== 'admin')) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Billing - Pending Payments</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient name or test type..."
            className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-medium">Patient Name</TableHead>
              <TableHead className="text-foreground font-medium">Test Name</TableHead>
              <TableHead className="text-foreground font-medium">Requested Date</TableHead>
              <TableHead className="text-foreground font-medium">Price</TableHead>
              <TableHead className="text-foreground font-medium">Status</TableHead>
              {currentUser.role === 'receptionist' && <TableHead className="text-foreground font-medium text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium text-foreground">{request.patientName}</TableCell>
                <TableCell className="text-muted-foreground">{request.testName}</TableCell>
                <TableCell className="text-muted-foreground">{request.requestedDate}</TableCell>
                <TableCell className="text-muted-foreground">${request.priceAtTimeOfRequest?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                    {request.status}
                  </Badge>
                </TableCell>
                {currentUser.role === 'receptionist' && (
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handleConfirmPayment(request.patientId, request.id)}
                    >
                      Confirm Payment
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRequests.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No lab requests pending payment found.
          </div>
        )}
      </Card>
    </div>
  );
}

    