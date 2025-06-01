
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { format, parseISO, isToday, isFuture, isPast, isValid } from 'date-fns';

import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/data/users';
import type { Appointment } from '@/lib/data/appointments';
import { getManagedAppointments, APPOINTMENTS_UPDATED_EVENT } from '@/lib/data/appointments';
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from 'next/navigation';

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled': return 'secondary';
    case 'confirmed': return 'default';
    case 'checked-in': return 'default';
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusClassName = (status: string) => {
    switch (status.toLowerCase()) {
        case 'scheduled': return 'bg-gray-500/20 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
        case 'confirmed': return 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-600/30 dark:text-yellow-400';
        case 'checked-in': return 'bg-blue-500/20 text-blue-700 dark:bg-blue-600/30 dark:text-blue-400';
        case 'completed': return 'bg-green-500/20 text-green-700 dark:bg-green-600/30 dark:text-green-400';
        case 'cancelled': return 'bg-red-500/20 text-red-700 dark:bg-red-600/30 dark:text-red-400';
        default: return '';
    }
};


const MyAppointmentTable = ({ appointments, onActionClick }: { appointments: Appointment[], onActionClick: (appointmentId: string) => void }) => (
  <Card className="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground font-medium">Date</TableHead>
          <TableHead className="text-foreground font-medium">Time</TableHead>
          <TableHead className="text-foreground font-medium">Patient</TableHead>
          <TableHead className="text-foreground font-medium">Status</TableHead>
          <TableHead className="text-foreground font-medium text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="text-muted-foreground">{format(parseISO(appointment.appointmentDate), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-muted-foreground">{appointment.appointmentTime}</TableCell>
            <TableCell className="font-medium text-foreground">{appointment.patientName}</TableCell>
            <TableCell>
              <Badge 
                variant={getStatusVariant(appointment.status) as any}
                className={cn(getStatusClassName(appointment.status))}
              >
                {appointment.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onActionClick(appointment.id)} asChild>
                 <Link href={`/admin/appointments/${appointment.id}`}> {/* Doctors can view details from here */}
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
        No appointments found for this category.
      </div>
    )}
  </Card>
);

export default function MyDoctorAppointmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; role: UserRole; username: string; } | null>(null);
  
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]); // This will hold only the doctor's appointments
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchMyAppointments = useCallback(() => {
    if (!currentUser || currentUser.role !== 'doctor' || !currentUser.id) {
      setMyAppointments([]);
      return;
    }
    const allAppointments = getManagedAppointments();
    const doctorAppointments = allAppointments.filter(apt => apt.doctorId === currentUser.id);
    setMyAppointments(doctorAppointments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [currentUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser) as { id: string; fullName: string; role: UserRole; username: string; };
          if (userData && userData.id && userData.role) {
            setCurrentUser(userData);
            if (userData.role !== 'doctor') {
              toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
              router.push('/admin');
            }
          } else {
            console.error("Invalid user data structure in localStorage on /admin/my-appointments page.");
            localStorage.removeItem('loggedInUser');
            router.push('/');
          }
        } catch (e) { console.error("Error parsing current user on /admin/my-appointments", e); router.push('/'); }
      } else {
        router.push('/');
      }
    }
  }, [router, toast, pathname]);

  useEffect(() => {
    if (currentUser) {
      fetchMyAppointments();
    }
  }, [currentUser, fetchMyAppointments]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener(APPOINTMENTS_UPDATED_EVENT, fetchMyAppointments);
      return () => {
        window.removeEventListener(APPOINTMENTS_UPDATED_EVENT, fetchMyAppointments);
      };
    }
  }, [fetchMyAppointments]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterAndCategorizeAppointments = (appointmentsToFilter: Appointment[]) => {
    const filteredBySearch = appointmentsToFilter.filter(apt => 
      apt.patientName.toLowerCase().includes(searchTerm) ||
      apt.status.toLowerCase().includes(searchTerm) // Doctor name search removed as it's always their own appointments
    );

    const today = new Date();
    today.setHours(0,0,0,0); 

    const upcoming = filteredBySearch.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isFuture(aptDate);
    }).sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime() || a.appointmentTime.localeCompare(b.appointmentTime));

    const todays = filteredBySearch.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isToday(aptDate);
    }).sort((a,b) => a.appointmentTime.localeCompare(b.appointmentTime));
    
    const past = filteredBySearch.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isPast(aptDate) && !isToday(aptDate);
    }).sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime() || b.appointmentTime.localeCompare(a.appointmentTime));
    
    return { upcoming, todays, past };
  };

  const { upcoming: upcomingAppointments, todays: todayAppointments, past: pastAppointments } = useMemo(
    () => filterAndCategorizeAppointments(myAppointments),
    [myAppointments, searchTerm]
  );

  const handleViewAppointmentDetails = (appointmentId: string) => {
    // Navigation is handled by Link component
  };

  if (!currentUser) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">My Appointments</h1>
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
                placeholder="Search by patient name or status..."
                className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={handleSearchChange}
                />
            </div>
        </div>

        <TabsContent value="upcoming">
          <MyAppointmentTable appointments={upcomingAppointments} onActionClick={handleViewAppointmentDetails} />
        </TabsContent>
        <TabsContent value="today">
          <MyAppointmentTable appointments={todayAppointments} onActionClick={handleViewAppointmentDetails} />
        </TabsContent>
        <TabsContent value="past">
          <MyAppointmentTable appointments={pastAppointments} onActionClick={handleViewAppointmentDetails} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
