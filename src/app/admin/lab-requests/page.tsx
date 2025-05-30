
'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Sample lab request data
const allLabRequests = [
  { id: 'lr1', patientName: 'Liam Harper', testType: 'Blood Panel', requestedDate: '2024-03-15', status: 'Pending' },
  { id: 'lr2', patientName: 'Olivia Bennett', testType: 'Urinalysis', requestedDate: '2024-03-16', status: 'Pending' },
  { id: 'lr3', patientName: 'Noah Carter', testType: 'X-Ray', requestedDate: '2024-03-17', status: 'Completed' },
  { id: 'lr4', patientName: 'Emma Hayes', testType: 'MRI', requestedDate: '2024-03-18', status: 'Pending' },
  { id: 'lr5', patientName: 'Ethan Foster', testType: 'CT Scan', requestedDate: '2024-03-19', status: 'Completed' },
  { id: 'lr6', patientName: 'Sophia Reed', testType: 'Blood Panel', requestedDate: '2024-03-20', status: 'Pending' },
];

type LabRequest = {
  id: string;
  patientName: string;
  testType: string;
  requestedDate: string;
  status: string;
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary'; 
    case 'completed':
      return 'default'; 
    default:
      return 'outline';
  }
};

const LabRequestTable = ({ requests, onActionClick }: { requests: LabRequest[], onActionClick: (requestId: string) => void }) => (
  <Card className="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground font-medium">Patient Name</TableHead>
          <TableHead className="text-foreground font-medium">Test Type</TableHead>
          <TableHead className="text-foreground font-medium">Requested Date</TableHead>
          <TableHead className="text-foreground font-medium">Status</TableHead>
          <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium text-foreground">{request.patientName}</TableCell>
            <TableCell className="text-muted-foreground">{request.testType}</TableCell>
            <TableCell className="text-muted-foreground">{request.requestedDate}</TableCell>
            <TableCell>
              <Badge 
                variant={getStatusVariant(request.status) as any}
                className={
                  request.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700' : 
                  request.status === 'Completed' ? 'bg-green-500/20 text-green-700' : ''
                }
              >
                {request.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onActionClick(request.id)} asChild>
                <Link href={`/admin/lab-requests/${request.id}`}>
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
        No lab requests found.
      </div>
    )}
  </Card>
);


export default function AdminLabRequestsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterRequests = (requests: LabRequest[]) => {
    let filtered = requests;
    // This initial filter based on activeTab for the displayed data is handled by the TabsContent logic below.
    // Here, we only apply the search term.
    if (!searchTerm) return filtered;
    return filtered.filter(req => 
      req.patientName.toLowerCase().includes(searchTerm) ||
      req.testType.toLowerCase().includes(searchTerm)
    );
  };

  const handleViewRequest = (requestId: string) => {
    console.log("View lab request:", requestId);
  };
  
  const getFilteredRequestsForTab = (tab: string) => {
    let baseRequests: LabRequest[];
    switch (tab) {
      case 'pending':
        baseRequests = allLabRequests.filter(req => req.status.toLowerCase() === 'pending');
        break;
      case 'completed':
        baseRequests = allLabRequests.filter(req => req.status.toLowerCase() === 'completed');
        break;
      case 'all':
      default:
        baseRequests = allLabRequests;
        break;
    }
    return filterRequests(baseRequests);
  };


  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Lab Requests</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="border-b border-border px-0 bg-transparent w-full justify-start rounded-none">
          <TabsTrigger 
            value="all" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            Completed
          </TabsTrigger>
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

        <TabsContent value="all">
          <LabRequestTable requests={getFilteredRequestsForTab('all')} onActionClick={handleViewRequest} />
        </TabsContent>
        <TabsContent value="pending">
          <LabRequestTable requests={getFilteredRequestsForTab('pending')} onActionClick={handleViewRequest} />
        </TabsContent>
        <TabsContent value="completed">
          <LabRequestTable requests={getFilteredRequestsForTab('completed')} onActionClick={handleViewRequest} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
