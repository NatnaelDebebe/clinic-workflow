
'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

// Sample appointment data
const upcomingAppointments = [
  { id: 'apt1', time: '09:00 AM', date: '2024-07-25', patient: 'Emily Carter', doctor: 'Dr. Robert Harris', status: 'Scheduled' },
  { id: 'apt2', time: '10:00 AM', date: '2024-07-25', patient: 'David Lee', doctor: 'Dr. Amelia Harper', status: 'Scheduled' },
  { id: 'apt3', time: '11:00 AM', date: '2024-07-26', patient: 'Olivia Brown', doctor: 'Dr. Robert Harris', status: 'Confirmed' },
];

const todayAppointments = [
  { id: 'apt4', time: '02:00 PM', date: '2024-07-24', patient: 'Ethan Clark', doctor: 'Dr. Amelia Harper', status: 'Checked-In' },
  { id: 'apt5', time: '03:00 PM', date: '2024-07-24', patient: 'Sophia Davis', doctor: 'Dr. Robert Harris', status: 'Scheduled' },
];

const pastAppointments = [
  { id: 'apt6', time: '10:00 AM', date: '2024-07-20', patient: 'Michael Wilson', doctor: 'Dr. Amelia Harper', status: 'Completed' },
  { id: 'apt7', time: '11:30 AM', date: '2024-07-20', patient: 'Jessica Garcia', doctor: 'Dr. Robert Harris', status: 'Cancelled' },
];

type Appointment = {
  id: string;
  time: string;
  date: string;
  patient: string;
  doctor: string;
  status: string;
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'secondary';
    case 'confirmed':
      return 'default';
    case 'checked-in':
      return 'default'; // Potentially a different color like blue if theme supports
    case 'completed':
      return 'outline'; // Or a success color
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};


const AppointmentTable = ({ appointments, onActionClick }: { appointments: Appointment[], onActionClick: (appointmentId: string) => void }) => (
  <Card className="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground font-medium">Date</TableHead>
          <TableHead className="text-foreground font-medium">Time</TableHead>
          <TableHead className="text-foreground font-medium">Patient</TableHead>
          <TableHead className="text-foreground font-medium">Doctor</TableHead>
          <TableHead className="text-foreground font-medium">Status</TableHead>
          <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="text-muted-foreground">{appointment.date}</TableCell>
            <TableCell className="text-muted-foreground">{appointment.time}</TableCell>
            <TableCell className="font-medium text-foreground">{appointment.patient}</TableCell>
            <TableCell className="text-muted-foreground">{appointment.doctor}</TableCell>
            <TableCell>
              <Badge 
                variant={getStatusVariant(appointment.status) as any}
                className={cn({
                  'bg-blue-500/20 text-blue-700': appointment.status === 'Checked-In',
                  'bg-green-500/20 text-green-700': appointment.status === 'Completed',
                  'bg-yellow-500/20 text-yellow-700': appointment.status === 'Confirmed',
                })}
              >
                {appointment.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onActionClick(appointment.id)} asChild>
                <Link href={`/admin/appointments/${appointment.id}`}>
                  <Eye className="h-5 w-5 text-muted-foreground hover:text-accent" />
                  <span className="sr-only">View Appointment</span>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {appointments.length === 0 && (
      <div className="text-center py-10 text-muted-foreground">
        No appointments found.
      </div>
    )}
  </Card>
);


export default function AdminAppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("upcoming");

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterAppointments = (appointments: Appointment[]) => {
    if (!searchTerm) return appointments;
    return appointments.filter(apt => 
      apt.patient.toLowerCase().includes(searchTerm) ||
      apt.doctor.toLowerCase().includes(searchTerm)
    );
  };

  const handleViewAppointment = (appointmentId: string) => {
    // Placeholder for view action, e.g., navigate to appointment detail page
    console.log("View appointment:", appointmentId);
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Appointments</h1>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="border-b border-border px-0 bg-transparent w-full justify-start rounded-none">
          <TabsTrigger 
            value="upcoming" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger 
            value="today" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            Today
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="pb-3 pt-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none rounded-none text-sm font-bold tracking-[0.015em]"
          >
            Past
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6 mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by patient name or doctor..."
                className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={handleSearchChange}
                />
            </div>
        </div>

        <TabsContent value="upcoming">
          <AppointmentTable appointments={filterAppointments(upcomingAppointments)} onActionClick={handleViewAppointment} />
        </TabsContent>
        <TabsContent value="today">
          <AppointmentTable appointments={filterAppointments(todayAppointments)} onActionClick={handleViewAppointment} />
        </TabsContent>
        <TabsContent value="past">
          <AppointmentTable appointments={filterAppointments(pastAppointments)} onActionClick={handleViewAppointment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper cn function if not globally available
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
