
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search, FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getManagedPatients, saveManagedPatients, type PatientLabRequest, type Patient, PATIENTS_UPDATED_EVENT } from '@/lib/data/patients';
import type { UserRole } from '@/lib/data/users';
import { userRoles as validUserRoles } from '@/lib/data/users';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface LabRequestWithPatientInfo extends PatientLabRequest {
  patientId: string;
  // patientName is already part of PatientLabRequest
}

const LabResultSchema = z.object({
  resultsSummary: z.string().min(1, "Results summary cannot be empty."),
});
type LabResultFormData = z.infer<typeof LabResultSchema>;

const TABS_CONFIG: Array<{value: PatientLabRequest['status'] | 'all', label: string, roles: UserRole[]}> = [
  { value: 'all', label: 'All', roles: ['admin', 'doctor', 'receptionist', 'lab_tech'] },
  { value: 'Pending Payment', label: 'Pending Payment', roles: ['admin', 'receptionist', 'doctor'] },
  { value: 'Pending', label: 'Pending Processing', roles: ['admin', 'lab_tech', 'doctor'] },
  { value: 'Completed', label: 'Completed', roles: ['admin', 'lab_tech', 'doctor', 'receptionist'] },
  { value: 'Cancelled', label: 'Cancelled', roles: ['admin', 'doctor', 'receptionist'] },
];

const getStatusVariant = (status: PatientLabRequest['status']) => {
  switch (status) {
    case 'Pending Payment':
      return 'secondary';
    case 'Pending':
      return 'default';
    case 'Completed':
      return 'outline';
    case 'Cancelled':
        return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusClassName = (status: PatientLabRequest['status']) => {
    switch (status) {
        case 'Pending Payment':
            return 'bg-yellow-500/20 text-yellow-700';
        case 'Pending':
            return 'bg-blue-500/20 text-blue-700';
        case 'Completed':
            return 'bg-green-500/20 text-green-700';
        case 'Cancelled':
            return 'bg-red-500/20 text-red-700';
        default:
            return '';
    }
};

const LabRequestTable = ({
  requests,
  currentUserRole,
  onEnterResults,
}: {
  requests: LabRequestWithPatientInfo[],
  currentUserRole: UserRole | null,
  onEnterResults: (request: LabRequestWithPatientInfo) => void,
}) => (
  <Card className="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground font-medium">Patient Name</TableHead>
          <TableHead className="text-foreground font-medium">Test Type</TableHead>
          <TableHead className="text-foreground font-medium">Requested Date</TableHead>
          <TableHead className="text-foreground font-medium">Price</TableHead>
          <TableHead className="text-foreground font-medium">Status</TableHead>
          <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium text-foreground">{request.patientName}</TableCell>
            <TableCell className="text-muted-foreground">{request.testName}</TableCell>
            <TableCell className="text-muted-foreground">{request.requestedDate}</TableCell>
            <TableCell className="text-muted-foreground">${request.priceAtTimeOfRequest?.toFixed(2) || 'N/A'}</TableCell>
            <TableCell>
              <Badge
                variant={getStatusVariant(request.status)}
                className={getStatusClassName(request.status)}
              >
                {request.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-1">
              {currentUserRole === 'lab_tech' && request.status === 'Pending' && (
                <Button variant="outline" size="sm" onClick={() => onEnterResults(request)}>
                  <FileTextIcon className="mr-1 h-4 w-4" />
                  Enter Results
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/admin/patients/${request.patientId}?tab=lab_requests&requestId=${request.id}`}>
                  <Eye className="h-5 w-5 text-muted-foreground hover:text-accent" />
                  <span className="sr-only">View Details</span>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {requests.length === 0 && (
      <div className="text-center py-10 text-muted-foreground">
        No lab requests found for this filter.
      </div>
    )}
  </Card>
);

export default function AdminLabRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; username: string; id: string; } | null>(null);

  const [activeTab, setActiveTab] = useState<PatientLabRequest['status'] | 'all'>("all");
  const [searchTerm, setSearchTerm] = useState('');
  const [allLabRequests, setAllLabRequests] = useState<LabRequestWithPatientInfo[]>([]);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [currentRequestForResults, setCurrentRequestForResults] = useState<LabRequestWithPatientInfo | null>(null);

  const { register: registerResult, handleSubmit: handleSubmitResult, reset: resetResult, formState: { errors: errorsResult } } = useForm<LabResultFormData>({
    resolver: zodResolver(LabResultSchema),
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (!storedUser) {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please log in." });
        router.push('/');
        return;
      }

      try {
        const userData = JSON.parse(storedUser) as { fullName: string; role: UserRole; username: string; id: string };
        if (!userData || !userData.id || !validUserRoles.includes(userData.role)) {
          toast({ variant: "destructive", title: "Authentication Error", description: "Invalid user data. Please log in again." });
          localStorage.removeItem('loggedInUser');
          router.push('/');
          return;
        }

        if (!['admin', 'doctor', 'lab_tech', 'receptionist'].includes(userData.role)) {
          toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
          router.push('/admin');
          return;
        }
        setCurrentUser(userData);
        
        // Set initial active tab based on role AFTER currentUser is validated and set
        if (userData.role === 'lab_tech') {
          setActiveTab('Pending');
        } else if (userData.role === 'receptionist') {
          setActiveTab('Pending Payment');
        } else {
          setActiveTab('all');
        }

      } catch (e) {
        console.error("Error parsing current user from localStorage on /admin/lab-requests", e);
        toast({ variant: "destructive", title: "Session Error", description: "Please log in again." });
        localStorage.removeItem('loggedInUser');
        router.push('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run once on mount


  const loadLabRequests = useCallback(() => {
    // currentUser check is important here as this function can be called by event listener
    if (typeof window === 'undefined' || !currentUser || !currentUser.id) return;

    const patients = getManagedPatients();
    const requests: LabRequestWithPatientInfo[] = [];
    patients.forEach(patient => {
      patient.labRequests.forEach(req => {
        requests.push({
          ...req,
          patientId: patient.id,
          patientName: patient.name, // patient.name is correct here as per Patient interface
        });
      });
    });
    setAllLabRequests(requests.sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()));
  }, [currentUser]); // Depends on currentUser being set

  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadLabRequests();
    }
    const handlePatientsUpdate = () => {
      // Ensure currentUser is still valid before reloading
      if (currentUser && currentUser.id) {
        loadLabRequests();
      }
    };
    window.addEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    return () => {
      window.removeEventListener(PATIENTS_UPDATED_EVENT, handlePatientsUpdate);
    };
  }, [currentUser, loadLabRequests]);


  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const getFilteredRequestsForTab = (tabKey: PatientLabRequest['status'] | 'all') => {
    let baseRequests = allLabRequests;

    if (currentUser?.role === 'lab_tech' && tabKey === 'all') {
      // Lab techs see only 'Pending' and 'Completed' in their "All" view
      baseRequests = allLabRequests.filter(req => req.status === 'Pending' || req.status === 'Completed');
    } else if (tabKey !== 'all') {
      baseRequests = allLabRequests.filter(req => req.status === tabKey);
    }

    if (!searchTerm) return baseRequests;
    return baseRequests.filter(req =>
      (req.patientName && req.patientName.toLowerCase().includes(searchTerm)) ||
      req.testName.toLowerCase().includes(searchTerm)
    );
  };

  const openResultsModal = (request: LabRequestWithPatientInfo) => {
    if (currentUser?.role !== 'lab_tech') return;
    setCurrentRequestForResults(request);
    resetResult({ resultsSummary: request.resultsSummary || '' });
    setIsResultsModalOpen(true);
  };

  const onResultsSubmit: SubmitHandler<LabResultFormData> = (data) => {
    if (!currentRequestForResults || !currentUser || currentUser.role !== 'lab_tech' || !currentUser.id) return;

    const patients = getManagedPatients();
    const patientIndex = patients.findIndex(p => p.id === currentRequestForResults.patientId);
    if (patientIndex === -1) {
        toast({ variant: "destructive", title: "Error", description: "Patient not found." });
        return;
    }

    const patient = patients[patientIndex];
    const requestIndex = patient.labRequests.findIndex(req => req.id === currentRequestForResults.id);
    if (requestIndex === -1) {
        toast({ variant: "destructive", title: "Error", description: "Lab request not found." });
        return;
    }

    patient.labRequests[requestIndex].status = 'Completed';
    patient.labRequests[requestIndex].resultsSummary = data.resultsSummary;
    patient.labRequests[requestIndex].resultEnteredBy = currentUser.fullName;
    patient.labRequests[requestIndex].resultDate = new Date().toISOString().split('T')[0];

    patients[patientIndex] = patient;
    saveManagedPatients(patients);
    toast({ title: "Lab Results Submitted", description: `Results for ${patient.labRequests[requestIndex].testName} have been submitted.` });
    
    // Refresh local state for immediate UI update
    setAllLabRequests(prevRequests => prevRequests.map(req => 
        req.id === currentRequestForResults.id 
        ? {...req, status: 'Completed', resultsSummary: data.resultsSummary, resultEnteredBy: currentUser.fullName, resultDate: new Date().toISOString().split('T')[0]} 
        : req
    ));
    
    setIsResultsModalOpen(false);
    setCurrentRequestForResults(null);
    resetResult();
  };

  const availableTabs = useMemo(() => {
    if (!currentUser) return [];
    return TABS_CONFIG.filter(tab => tab.roles.includes(currentUser.role));
  }, [currentUser]);

  if (!currentUser || !currentUser.id) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Lab Requests</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PatientLabRequest['status'] | 'all')} className="w-full">
        <TabsList className="border-b border-border px-0 bg-transparent w-full justify-start rounded-none">
          {availableTabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 mb-6">
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

        {availableTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <LabRequestTable
              requests={getFilteredRequestsForTab(tab.value)}
              currentUserRole={currentUser.role}
              onEnterResults={openResultsModal}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isResultsModalOpen} onOpenChange={(isOpen) => {
        setIsResultsModalOpen(isOpen);
        if (!isOpen) {
          setCurrentRequestForResults(null);
          resetResult();
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">
              Enter Lab Results for {currentRequestForResults?.testName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitResult(onResultsSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="resultsSummary" className="text-muted-foreground">Results Summary</Label>
              <Textarea
                id="resultsSummary"
                {...registerResult("resultsSummary")}
                rows={8}
                className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground"
                placeholder="Enter the lab test results summary here..."
              />
              {errorsResult.resultsSummary && <p className="text-sm text-destructive mt-1">{errorsResult.resultsSummary.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Submit Results & Mark Completed</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    