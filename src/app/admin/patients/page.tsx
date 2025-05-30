
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card'; // Import Card from ShadCN

// Sample patient data
const allPatients = [
  { id: '1', name: 'Liam Harper', dob: '1985-03-15', gender: 'Male', lastVisit: '2023-11-20', status: 'Active' },
  { id: '2', name: 'Olivia Bennett', dob: '1992-07-22', gender: 'Female', lastVisit: '2023-12-05', status: 'Active' },
  { id: '3', name: 'Noah Foster', dob: '1978-11-10', gender: 'Male', lastVisit: '2023-10-15', status: 'Inactive' },
  { id: '4', name: 'Ava Mitchell', dob: '1989-05-08', gender: 'Female', lastVisit: '2023-11-28', status: 'Active' },
  { id: '5', name: 'Ethan Hayes', dob: '1995-09-18', gender: 'Male', lastVisit: '2023-12-10', status: 'Active' },
  { id: '6', name: 'Sophia Reed', dob: '1982-01-25', gender: 'Female', lastVisit: '2023-11-12', status: 'Active' },
  { id: '7', name: 'Jackson Cole', dob: '1975-06-03', gender: 'Male', lastVisit: '2023-10-20', status: 'Inactive' },
  { id: '8', name: 'Isabella Ward', dob: '1990-04-12', gender: 'Female', lastVisit: '2023-12-01', status: 'Active' },
  { id: '9', name: 'Aiden Brooks', dob: '1987-08-30', gender: 'Male', lastVisit: '2023-11-18', status: 'Active' },
  { id: '10', name: 'Mia Powell', dob: '1998-02-14', gender: 'Female', lastVisit: '2023-12-08', status: 'Active' },
];

export default function AdminPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredPatients = allPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Patients</h1>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients..."
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
              <TableHead className="text-foreground font-medium">Name</TableHead>
              <TableHead className="text-foreground font-medium">Date of Birth</TableHead>
              <TableHead className="text-foreground font-medium">Gender</TableHead>
              <TableHead className="text-foreground font-medium">Last Visit</TableHead>
              <TableHead className="text-foreground font-medium">Status</TableHead>
              <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium text-foreground">{patient.name}</TableCell>
                <TableCell className="text-muted-foreground">{patient.dob}</TableCell>
                <TableCell className="text-muted-foreground">{patient.gender}</TableCell>
                <TableCell className="text-muted-foreground">{patient.lastVisit}</TableCell>
                <TableCell>
                  <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'} className={patient.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/patients/${patient.id}`}>
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-accent" />
                      <span className="sr-only">View Patient</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {filteredPatients.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No patients found.
        </div>
      )}
    </div>
  );
}
