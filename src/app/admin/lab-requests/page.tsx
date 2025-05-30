
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getManagedPatients, saveManagedPatients, type PatientLabRequest } from '@/lib/data/patients';
import type { UserRole } from '@/lib/data/users';
import { userRoles as validUserRoles } from '@/lib/data/users'; 
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface LabRequestWithPatientInfo extends PatientLabRequest {
  patientId: string;
  patientName: string;
}

const TABS_CONFIG: Array<{value: PatientLabRequest['status'] | 'all', label: string, roles: UserRole[]}> = [
  { value: 'all', label: 'All', roles: ['admin', 'doctor', 'receptionist'] },
  { value: 'Pending Payment', label: 'Pending Payment', roles: ['admin', 'receptionist', 'doctor'] },
  { value: 'Pending', label: 'Pending Processing', roles: ['admin', 'lab_tech', 'doctor'] },
  { value: 'Completed', label: 'Completed', roles: ['admin', 'lab_tech', 'doctor', 'receptionist'] },
  { value: 'Cancelled', label: 'Cancelled', roles: ['admin', 'doctor', 'receptionist'] },
];

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending payment':
      return 'secondary'; 
    case 'pending': 
      return 'default'; 
    case 'completed':
      return 'outline'; 
    case 'cancelled':
        return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusClassName = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending payment':
            return 'bg-yellow-500/20 text-yellow-700';
        case 'pending': 
            return 'bg-blue-500/20 text-blue-700';
        case 'completed':
            return 'bg-green-500/20 text-green-700';
        case 'cancelled':
            return 'bg-red-500/20 text-red-700';
        default:
            return '';
    }
};


const LabRequestTable = ({ 
  requests, 
  currentUserRole,
  onMarkCompleted,
  onViewDetails,
}: { 
  requests: LabRequestWithPatientInfo[], 
  currentUserRole: UserRole | null,
  onMarkCompleted: (patientId: string, requestId: string) => void,
  onViewDetails: (patientId: string, requestId: string) => void,
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
                variant={getStatusVariant(request.status) as any}
                className={getStatusClassName(request.status)}
              >
                {request.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-1">
              {currentUserRole === 'lab_tech' && request.status === 'Pending' && (
                <Button variant="outline" size="sm" onClick={() => onMarkCompleted(request.patientId, request.id)}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark Completed
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onViewDetails(request.patientId, request.id)} asChild>
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
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole } | null>(null);
  
  const [activeTab, setActiveTab] = useState<PatientLabRequest['status'] | 'all'>("all");
  const [searchTerm, setSearchTerm] = useState('');
  const [allLabRequests, setAllLabRequests] = useState<LabRequestWithPatientInfo[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser) as { fullName: string; role: UserRole; username: string };
          
          if (!userData || !userData.role || !validUserRoles.includes(userData.role)) {
            toast({ variant: "destructive", title: "Authentication Error", description: "Invalid user data." });
            router.push('/');
            return;
          }
          setCurrentUser(userData);

           if (!['admin', 'doctor', 'lab_tech', 'receptionist'].includes(userData.role)) {
             toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
             router.push('/admin');
             return;
           }
          
          if (userData.role === 'lab_tech') {
            setActiveTab('Pending');
          } else if (userData.role === 'receptionist') {
            const receptionistTabs = TABS_CONFIG.filter(tab => tab.roles.includes('receptionist'));
             if (receptionistTabs.find(t => t.value === 'Pending Payment')) {
                  setActiveTab('Pending Payment');
             } else if (receptionistTabs.find(t => t.value === 'all')) {
                  setActiveTab('all');
             } else if (receptionistTabs.length > 0) {
                 setActiveTab(receptionistTabs[0].value);
             } else {
                setActiveTab('all'); // Fallback
             }
          } else {
            setActiveTab('all'); // Default for admin/doctor
          }

        } catch (e) { 
            console.error("Error parsing current user from localStorage on /admin/lab-requests", e); 
            router.push('/'); 
            return;
        }
      } else {
        router.push('/');
        return;
      }
    }
  }, [router, toast]); 

  useEffect(() => { 
    if (currentUser) { 
      loadLabRequests();
    }
  }, [currentUser]);


  const loadLabRequests = () => {
    if (!currentUser) return; 

    const patients = getManagedPatients();
    const requests: LabRequestWithPatientInfo[] = [];
    patients.forEach(patient => {
      patient.labRequests.forEach(req => {
        if (currentUser.role === 'lab_tech' && !(req.status === 'Pending' || req.status === 'Completed')) {
          return; 
        }
        requests.push({
          ...req,
          patientId: patient.id,
          patientName: patient.name,
        });
      });
    });
    setAllLabRequests(requests.sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const getFilteredRequestsForTab = (tabKey: PatientLabRequest['status'] | 'all') => {
    let baseRequests = allLabRequests; 
    
    if (tabKey !== 'all') {
      baseRequests = allLabRequests.filter(req => req.status === tabKey);
    }
    
    if (!searchTerm) return baseRequests;
    return baseRequests.filter(req => 
      req.patientName.toLowerCase().includes(searchTerm) ||
      req.testName.toLowerCase().includes(searchTerm)
    );
  };
  
  const handleMarkCompleted = (patientId: string, requestId: string) => {
    if (currentUser?.role !== 'lab_tech') return;

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
    
    patient.labRequests[requestIndex].status = 'Completed';
    patients[patientIndex] = patient;
    saveManagedPatients(patients);
    toast({ title: "Lab Test Completed", description: `${patient.labRequests[requestIndex].testName} marked as completed.` });
    loadLabRequests(); 
  };

  const handleViewDetails = (patientId: string, requestId: string) => {
    // Intentionally left for navigation via Link component
  };
  
  const availableTabs = useMemo(() => {
    if (!currentUser) return [];
    return TABS_CONFIG.filter(tab => tab.roles.includes(currentUser.role));
  }, [currentUser]);

  if (!currentUser) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Lab Requests</h1>
      </div>

      <div className="lg:col-span-1">
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
                  onMarkCompleted={handleMarkCompleted}
                  onViewDetails={handleViewDetails}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
    </div>
  );
}
