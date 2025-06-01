
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, Eye, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, isToday, isFuture, isPast, isValid } from 'date-fns';

import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/lib/data/users';
import { getManagedUsers } from '@/lib/data/users';
import type { Patient } from '@/lib/data/patients';
import { getManagedPatients } from '@/lib/data/patients';
import type { Appointment } from '@/lib/data/appointments';
import { getManagedAppointments, saveManagedAppointments, APPOINTMENTS_UPDATED_EVENT } from '@/lib/data/appointments';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.date({ required_error: "Appointment date is required" }),
  appointmentTime: z.string().min(1, "Appointment time is required").regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof AppointmentSchema>;

interface DoctorForForm {
  id: string;
  fullName: string;
  specialization?: string;
}

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
            <TableCell className="text-muted-foreground">{format(parseISO(appointment.appointmentDate), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="text-muted-foreground">{appointment.appointmentTime}</TableCell>
            <TableCell className="font-medium text-foreground">{appointment.patientName}</TableCell>
            <TableCell className="text-muted-foreground">{appointment.doctorName}</TableCell>
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
        No appointments found for this category.
      </div>
    )}
  </Card>
);


export default function AdminAppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; role: UserRole; username: string; } | null>(null);
  
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [patientsForForm, setPatientsForForm] = useState<Patient[]>([]);
  const [doctorsForForm, setDoctorsForForm] = useState<DoctorForForm[]>([]);

  const { register, handleSubmit: handleFormSubmit, reset, control, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentSchema),
  });

  const fetchAppointments = useCallback(() => {
    if (!currentUser) return; // Ensure currentUser is available
    let appointments = getManagedAppointments();
    if (currentUser.role === 'doctor') {
      appointments = appointments.filter(apt => apt.doctorId === currentUser.id);
    }
    // Sort by creation date descending for initial load, tab filtering will re-sort
    setAllAppointments(appointments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [currentUser]);

  // Effect for setting up current user and initial form data (patients & doctors)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData); // Set current user
           if (!['admin', 'receptionist', 'doctor'].includes(userData.role)) {
             toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page."});
             router.push('/admin');
             return;
           }
        } catch (e) { console.error("Error parsing current user", e); router.push('/'); return; }
      } else {
        router.push('/');
        return;
      }
    }
    
    setPatientsForForm(getManagedPatients().filter(p => p.status === 'Active'));
    setDoctorsForForm(
      getManagedUsers()
        .filter(u => u.role === 'doctor' && u.status === 'Active')
        .map(d => ({ id: d.id, fullName: d.fullName, specialization: d.specialization }))
    );
  }, [router, toast]); // Runs once on mount or if router/toast references change (they generally don't)

  // Effect for fetching appointments when currentUser changes or fetchAppointments callback is redefined
  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser, fetchAppointments]);

  // Effect for managing the APPOINTMENTS_UPDATED_EVENT listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // The fetchAppointments callback already depends on currentUser,
      // so it will be the correct version when this effect re-runs.
      window.addEventListener(APPOINTMENTS_UPDATED_EVENT, fetchAppointments);
      return () => {
        window.removeEventListener(APPOINTMENTS_UPDATED_EVENT, fetchAppointments);
      };
    }
  }, [fetchAppointments]); // Re-binds if fetchAppointments changes


  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterAndCategorizeAppointments = (appointments: Appointment[]) => {
    const filtered = appointments.filter(apt => 
      apt.patientName.toLowerCase().includes(searchTerm) ||
      apt.doctorName.toLowerCase().includes(searchTerm) ||
      apt.status.toLowerCase().includes(searchTerm)
    );

    const today = new Date();
    today.setHours(0,0,0,0); 

    const upcoming = filtered.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isFuture(aptDate);
    }).sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime() || a.appointmentTime.localeCompare(b.appointmentTime));

    const todays = filtered.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isToday(aptDate);
    }).sort((a,b) => a.appointmentTime.localeCompare(b.appointmentTime));
    
    const past = filtered.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return isValid(aptDate) && isPast(aptDate) && !isToday(aptDate);
    }).sort((a,b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime() || b.appointmentTime.localeCompare(a.appointmentTime));
    
    return { upcoming, todays, past };
  };

  const { upcoming: upcomingAppointments, todays: todayAppointments, past: pastAppointments } = useMemo(
    () => filterAndCategorizeAppointments(allAppointments),
    [allAppointments, searchTerm]
  );


  const handleViewAppointment = (appointmentId: string) => {
    // Navigation is handled by Link component
  };

  const openNewAppointmentForm = () => {
    reset({ patientId: '', doctorId: '', appointmentDate: undefined, appointmentTime: '', notes: '' });
    setIsAppointmentFormOpen(true);
  };

  const onAppointmentSubmit: SubmitHandler<AppointmentFormData> = (data) => {
    const selectedPatient = patientsForForm.find(p => p.id === data.patientId);
    const selectedDoctor = doctorsForForm.find(d => d.id === data.doctorId);

    if (!selectedPatient || !selectedDoctor) {
      toast({ variant: "destructive", title: "Error", description: "Selected patient or doctor not found." });
      return;
    }

    const newAppointment: Appointment = {
      id: (Math.random() + 1).toString(36).substring(2),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.fullName,
      appointmentDate: format(data.appointmentDate, 'yyyy-MM-dd'),
      appointmentTime: data.appointmentTime,
      status: 'Scheduled',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    const currentAppointments = getManagedAppointments();
    saveManagedAppointments([...currentAppointments, newAppointment]);
    toast({ title: "Appointment Scheduled", description: `Appointment for ${newAppointment.patientName} with ${newAppointment.doctorName} has been scheduled.` });
    setIsAppointmentFormOpen(false);
  };

  if (!currentUser) {
    return <div className="flex flex-1 justify-center items-center p-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Appointments</h1>
        {currentUser.role === 'receptionist' && (
          <Button onClick={openNewAppointmentForm} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        )}
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
                placeholder="Search by patient, doctor, or status..."
                className="pl-10 h-12 rounded-xl border-input bg-card placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={handleSearchChange}
                />
            </div>
        </div>

        <TabsContent value="upcoming">
          <AppointmentTable appointments={upcomingAppointments} onActionClick={handleViewAppointment} />
        </TabsContent>
        <TabsContent value="today">
          <AppointmentTable appointments={todayAppointments} onActionClick={handleViewAppointment} />
        </TabsContent>
        <TabsContent value="past">
          <AppointmentTable appointments={pastAppointments} onActionClick={handleViewAppointment} />
        </TabsContent>
      </Tabs>

      <Dialog open={isAppointmentFormOpen} onOpenChange={(isOpen) => {
        setIsAppointmentFormOpen(isOpen);
        if (!isOpen) reset();
      }}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit(onAppointmentSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            <div>
              <Label htmlFor="patientId" className="text-muted-foreground">Patient</Label>
              <Controller
                name="patientId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="patientId" className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {patientsForForm.map(p => (
                        <SelectItem key={p.id} value={p.id} className="hover:bg-accent focus:bg-accent">
                          {p.name} (DOB: {p.dob})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.patientId && <p className="text-sm text-destructive mt-1">{errors.patientId.message}</p>}
            </div>

            <div>
              <Label htmlFor="doctorId" className="text-muted-foreground">Doctor</Label>
              <Controller
                name="doctorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="doctorId" className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {doctorsForForm.map(d => (
                        <SelectItem key={d.id} value={d.id} className="hover:bg-accent focus:bg-accent">
                          {d.fullName} {d.specialization ? `(${d.specialization})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.doctorId && <p className="text-sm text-destructive mt-1">{errors.doctorId.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="appointmentDate" className="text-muted-foreground">Date</Label>
                    <Controller
                        name="appointmentDate"
                        control={control}
                        render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-card" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                    {errors.appointmentDate && <p className="text-sm text-destructive mt-1">{errors.appointmentDate.message}</p>}
                </div>
                <div>
                    <Label htmlFor="appointmentTime" className="text-muted-foreground">Time (HH:MM)</Label>
                    <Input 
                        id="appointmentTime" 
                        type="time" 
                        {...register("appointmentTime")} 
                        className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" 
                    />
                    {errors.appointmentTime && <p className="text-sm text-destructive mt-1">{errors.appointmentTime.message}</p>}
                </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-muted-foreground">Notes (Optional)</Label>
              <Textarea id="notes" {...register("notes")} rows={3} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Schedule Appointment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
