
'use client';

import { useState, type ChangeEvent, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, PlusCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getManagedPatients, saveManagedPatients, type Patient, type Gender } from '@/lib/data/patients';
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from '@/lib/data/users';

const PatientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Full name is required"),
  dob: z.string().min(1, "Date of Birth is required"), // Consider using a date picker and date validation
  gender: z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: "Gender is required" }) }),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional().refine(val => !val || /^\+?[0-9\s\-()]{7,20}$/.test(val), {message: "Invalid emergency phone number"}),
  status: z.enum(['Active', 'Inactive']),
});

type PatientFormData = z.infer<typeof PatientSchema>;

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  // For this prototype, we'll assume 'editingPatient' functionality would be similar and focus on creation
  // const [editingPatient, setEditingPatient] = useState<Patient | null>(null); 
  const { toast } = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
      name: '',
      dob: '',
      gender: undefined,
      address: '',
      phoneNumber: '',
      email: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      status: 'Active',
    }
  });

  useEffect(() => {
    setPatients(getManagedPatients());
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUserRole(userData.role as UserRole);
        } catch (error) {
          console.error("Failed to parse user data from localStorage for role check", error);
        }
      }
    }
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
      patient.phoneNumber.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const openCreateForm = () => {
    // setEditingPatient(null); 
    reset({ name: '', dob: '', gender: undefined, address: '', phoneNumber: '', email: '', emergencyContactName: '', emergencyContactPhone: '', status: 'Active' });
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<PatientFormData> = (data) => {
    const newPatient: Patient = {
      ...data,
      id: (Math.random() + 1).toString(36).substring(7), // simple unique ID
      registrationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      email: data.email || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      lastVisit: undefined, // New patients won't have a last visit yet
    };
    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    saveManagedPatients(updatedPatients);
    toast({ title: "Patient Created", description: `${newPatient.name} has been added.` });
    setIsFormOpen(false);
  };


  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-foreground tracking-tight text-3xl font-bold font-headline">Patients</h1>
        {currentUserRole === 'receptionist' && (
          <Button onClick={openCreateForm} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients by name, email, or phone..."
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
              <TableHead className="text-foreground font-medium">Phone Number</TableHead>
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
                <TableCell className="text-muted-foreground">{patient.phoneNumber}</TableCell>
                <TableCell>
                  <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'} className={patient.status === 'Active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/patients/${patient.id}`}> {/* Detail page not yet implemented */}
                      <Eye className="h-5 w-5 text-muted-foreground hover:text-accent" />
                      <span className="sr-only">View Patient</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {filteredPatients.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No patients found.
          </div>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
          reset();
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground font-headline">Add New Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                <Input id="name" {...register("name")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="dob" className="text-muted-foreground">Date of Birth</Label>
                <Input id="dob" type="date" {...register("dob")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.dob && <p className="text-sm text-destructive mt-1">{errors.dob.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="gender" className="text-muted-foreground">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                    <SelectTrigger id="gender" className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {(['Male', 'Female', 'Other'] as Gender[]).map(g => (
                        <SelectItem key={g} value={g} className="hover:bg-accent focus:bg-accent">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <Label htmlFor="address" className="text-muted-foreground">Address</Label>
              <Textarea id="address" {...register("address")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
              {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber" className="text-muted-foreground">Phone Number</Label>
                <Input id="phoneNumber" {...register("phoneNumber")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.phoneNumber && <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Email (Optional)</Label>
                <Input id="email" type="email" {...register("email")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName" className="text-muted-foreground">Emergency Contact Name (Optional)</Label>
                <Input id="emergencyContactName" {...register("emergencyContactName")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.emergencyContactName && <p className="text-sm text-destructive mt-1">{errors.emergencyContactName.message}</p>}
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone" className="text-muted-foreground">Emergency Contact Phone (Optional)</Label>
                <Input id="emergencyContactPhone" {...register("emergencyContactPhone")} className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground" />
                {errors.emergencyContactPhone && <p className="text-sm text-destructive mt-1">{errors.emergencyContactPhone.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-muted-foreground">Status</Label>
               <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "Active"} >
                    <SelectTrigger id="status" className="mt-1 bg-background border-input text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {(['Active', 'Inactive'] as const).map(s => (
                        <SelectItem key={s} value={s} className="hover:bg-accent focus:bg-accent">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Add Patient</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
